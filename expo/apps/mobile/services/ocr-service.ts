// OCR Service for Receipt Processing
// Integrates with Jason OCR API for expense receipt data extraction

import { createClient } from '@supabase/supabase-js';
import ExifReader from 'exifreader';

const JASON_OCR_API_URL = process.env.JASON_OCR_API_URL || 'https://api.jasonocr.com/v1';
const JASON_OCR_API_KEY = process.env.JASON_OCR_API_KEY!;

export interface OCRResult {
  merchantName: string | null;
  amount: number | null;
  currency: string | null;
  date: Date | null;
  category: string | null;
  taxAmount: number | null;
  paymentMethod: string | null;
  confidence: number;
  rawText: string;
  metadata: {
    itemizedList?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    address?: string;
    phoneNumber?: string;
    receiptNumber?: string;
    [key: string]: any;
  };
}

export interface OCRError {
  code: string;
  message: string;
  details?: any;
}

export class OCRService {
  private supabase: any;
  
  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Process receipt image with OCR
   */
  async processReceipt(
    imageData: string | Buffer,
    options: {
      enhanceImage?: boolean;
      detectCurrency?: boolean;
      extractLineItems?: boolean;
    } = {}
  ): Promise<OCRResult> {
    try {
      // Prepare image for OCR
      const base64Image = await this.prepareImage(imageData);
      
      // Extract EXIF data for additional metadata
      const exifData = await this.extractExifData(imageData);
      
      // Call Jason OCR API
      const ocrResponse = await fetch(`${JASON_OCR_API_URL}/receipts/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JASON_OCR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          enhance: options.enhanceImage ?? true,
          extract_line_items: options.extractLineItems ?? true,
          detect_currency: options.detectCurrency ?? true,
          return_confidence: true,
          language_hints: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
        }),
      });

      if (!ocrResponse.ok) {
        throw new Error(`OCR API error: ${ocrResponse.statusText}`);
      }

      const ocrData = await ocrResponse.json();
      
      // Process and normalize OCR results
      const result = this.normalizeOCRResult(ocrData, exifData);
      
      // Apply AI enhancement if confidence is low
      if (result.confidence < 0.8) {
        return await this.enhanceWithAI(result);
      }
      
      return result;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw {
        code: 'OCR_PROCESSING_ERROR',
        message: 'Failed to process receipt',
        details: error,
      } as OCRError;
    }
  }

  /**
   * Prepare image for OCR processing
   */
  private async prepareImage(imageData: string | Buffer): Promise<string> {
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      // Already base64 encoded
      return imageData.split(',')[1];
    }
    
    if (Buffer.isBuffer(imageData)) {
      return imageData.toString('base64');
    }
    
    // Assume it's a file path or URL
    if (typeof imageData === 'string') {
      if (imageData.startsWith('http')) {
        // Download image
        const response = await fetch(imageData);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
      } else {
        // Read from Supabase storage
        const { data, error } = await this.supabase.storage
          .from('receipts')
          .download(imageData);
          
        if (error) throw error;
        
        const buffer = await data.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
      }
    }
    
    throw new Error('Invalid image data format');
  }

  /**
   * Extract EXIF data for additional context
   */
  private async extractExifData(imageData: any): Promise<any> {
    try {
      const tags = await ExifReader.load(imageData);
      return {
        dateTime: tags.DateTime?.description,
        gpsLocation: tags.GPSLatitude && tags.GPSLongitude ? {
          lat: tags.GPSLatitude.description,
          lng: tags.GPSLongitude.description,
        } : null,
        device: tags.Make?.description,
      };
    } catch {
      return {};
    }
  }

  /**
   * Normalize OCR results to standard format
   */
  private normalizeOCRResult(ocrData: any, exifData: any): OCRResult {
    // Extract amount with currency detection
    const amount = this.extractAmount(ocrData);
    const currency = this.detectCurrency(ocrData);
    
    return {
      merchantName: ocrData.merchant?.name || this.extractMerchantName(ocrData.text),
      amount: amount.total,
      currency: currency || 'USD',
      date: this.parseDate(ocrData.date || exifData.dateTime),
      category: this.suggestCategory(ocrData),
      taxAmount: amount.tax,
      paymentMethod: this.extractPaymentMethod(ocrData),
      confidence: ocrData.confidence || 0.5,
      rawText: ocrData.text || '',
      metadata: {
        itemizedList: ocrData.line_items || [],
        address: ocrData.merchant?.address,
        phoneNumber: ocrData.merchant?.phone,
        receiptNumber: ocrData.receipt_number,
        gpsLocation: exifData.gpsLocation,
        ocrProvider: 'jason_ocr',
        processingTime: ocrData.processing_time_ms,
      },
    };
  }

  /**
   * Extract amount information from OCR data
   */
  private extractAmount(ocrData: any): { total: number | null; tax: number | null } {
    const amounts = ocrData.amounts || {};
    
    // Try to find total amount
    let total = amounts.total || amounts.grand_total || amounts.amount;
    
    // Fallback to regex extraction
    if (!total && ocrData.text) {
      const totalMatch = ocrData.text.match(/(?:total|amount|sum)[\s:]*\$?([\d,]+\.?\d*)/i);
      if (totalMatch) {
        total = parseFloat(totalMatch[1].replace(/,/g, ''));
      }
    }
    
    // Extract tax
    let tax = amounts.tax || amounts.vat || amounts.gst;
    if (!tax && ocrData.text) {
      const taxMatch = ocrData.text.match(/(?:tax|vat|gst)[\s:]*\$?([\d,]+\.?\d*)/i);
      if (taxMatch) {
        tax = parseFloat(taxMatch[1].replace(/,/g, ''));
      }
    }
    
    return {
      total: total ? parseFloat(total) : null,
      tax: tax ? parseFloat(tax) : null,
    };
  }

  /**
   * Detect currency from OCR data
   */
  private detectCurrency(ocrData: any): string | null {
    if (ocrData.currency) return ocrData.currency;
    
    const text = ocrData.text || '';
    const currencyPatterns = {
      USD: /\$|USD|US\$/,
      EUR: /€|EUR/,
      GBP: /£|GBP/,
      JPY: /¥|JPY|円/,
      SGD: /S\$|SGD/,
      AUD: /A\$|AUD/,
      CAD: /C\$|CAD/,
    };
    
    for (const [currency, pattern] of Object.entries(currencyPatterns)) {
      if (pattern.test(text)) return currency;
    }
    
    return null;
  }

  /**
   * Extract merchant name with fallback strategies
   */
  private extractMerchantName(text: string): string | null {
    if (!text) return null;
    
    // Look for common patterns
    const lines = text.split('\n').filter(line => line.trim());
    
    // Usually merchant name is in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // Skip common receipt headers
      if (!/receipt|invoice|bill|tax|date|time/i.test(line) && line.length > 3) {
        return line;
      }
    }
    
    return null;
  }

  /**
   * Parse various date formats
   */
  private parseDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    
    try {
      // Try standard parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
      
      // Try common receipt date formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,  // MM/DD/YYYY or MM/DD/YY
        /(\d{1,2})-(\d{1,2})-(\d{2,4})/,    // MM-DD-YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/,      // YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          // Parse based on format
          return new Date(dateStr);
        }
      }
    } catch {
      // Ignore parse errors
    }
    
    return null;
  }

  /**
   * Suggest expense category based on merchant and items
   */
  private suggestCategory(ocrData: any): string | null {
    const merchantName = (ocrData.merchant?.name || '').toLowerCase();
    const items = ocrData.line_items || [];
    const text = (ocrData.text || '').toLowerCase();
    
    // Category detection rules
    const categoryRules = [
      { keywords: ['restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner', 'breakfast'], category: 'Meals' },
      { keywords: ['hotel', 'motel', 'inn', 'accommodation', 'lodging'], category: 'Accommodation' },
      { keywords: ['airline', 'flight', 'airport', 'boarding'], category: 'Travel' },
      { keywords: ['taxi', 'uber', 'lyft', 'transport', 'bus', 'train', 'subway'], category: 'Transportation' },
      { keywords: ['office', 'staples', 'supplies', 'stationery'], category: 'Office Supplies' },
      { keywords: ['training', 'course', 'conference', 'seminar'], category: 'Training' },
      { keywords: ['mobile', 'phone', 'internet', 'communication'], category: 'Communication' },
    ];
    
    for (const rule of categoryRules) {
      if (rule.keywords.some(keyword => 
        merchantName.includes(keyword) || 
        text.includes(keyword) ||
        items.some((item: any) => item.description?.toLowerCase().includes(keyword))
      )) {
        return rule.category;
      }
    }
    
    return null;
  }

  /**
   * Extract payment method from receipt
   */
  private extractPaymentMethod(ocrData: any): string | null {
    const text = (ocrData.text || '').toLowerCase();
    
    if (/visa|mastercard|amex|american express|credit card/i.test(text)) {
      return 'Credit Card';
    }
    
    if (/debit|checking/i.test(text)) {
      return 'Debit Card';
    }
    
    if (/cash/i.test(text)) {
      return 'Cash';
    }
    
    if (/paypal|venmo|zelle/i.test(text)) {
      return 'Digital Wallet';
    }
    
    return null;
  }

  /**
   * Enhance low-confidence results with AI
   */
  private async enhanceWithAI(result: OCRResult): Promise<OCRResult> {
    try {
      // Call AI service to improve extraction
      const enhancedData = await this.callAIEnhancement(result);
      
      return {
        ...result,
        ...enhancedData,
        confidence: Math.min(result.confidence + 0.2, 0.95),
        metadata: {
          ...result.metadata,
          aiEnhanced: true,
        },
      };
    } catch {
      // Return original if enhancement fails
      return result;
    }
  }

  /**
   * Call AI service for enhancement (placeholder for actual implementation)
   */
  private async callAIEnhancement(result: OCRResult): Promise<Partial<OCRResult>> {
    // This would integrate with your AI service (Claude/GPT)
    // to improve extraction accuracy
    return {};
  }

  /**
   * Batch process multiple receipts
   */
  async batchProcessReceipts(
    images: Array<{ id: string; data: string | Buffer }>,
    options?: any
  ): Promise<Array<{ id: string; result: OCRResult | null; error?: OCRError }>> {
    const results = await Promise.allSettled(
      images.map(async (image) => ({
        id: image.id,
        result: await this.processReceipt(image.data, options),
      }))
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: images[index].id,
          result: null,
          error: {
            code: 'BATCH_PROCESSING_ERROR',
            message: result.reason?.message || 'Processing failed',
            details: result.reason,
          },
        };
      }
    });
  }
}