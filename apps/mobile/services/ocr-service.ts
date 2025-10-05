// OCR Service for Receipt Processing
// Integrates with render-mcp-bridge FREE OCR service (OCR.space)

import { createClient } from '@supabase/supabase-js';

// Render MCP Bridge - FREE OCR endpoint (deployed on Vercel)
const MCP_BRIDGE_URL = process.env.EXPO_PUBLIC_MCP_BRIDGE_URL ||
  'https://render-mcp-bridge-919ww1du3-jake-tolentinos-projects-c0369c83.vercel.app';

// Fallback: Direct OCR.space API (25,000 free requests/month)
const OCRSPACE_API_KEY = process.env.EXPO_PUBLIC_OCRSPACE_API_KEY || 'K87899142388957';

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
   * Process receipt image with OCR using render-mcp-bridge (FREE)
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
      // Upload image to Supabase storage first
      const storagePath = await this.uploadToSupabase(imageData);

      // Get current user ID
      const { data: { user } } = await this.supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // Call render-mcp-bridge FREE OCR endpoint
      const ocrResponse = await fetch(`${MCP_BRIDGE_URL}/api/receipts/instant-ocr-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storage_path: storagePath,
          schema_name: 'receipt_v1',
          user_id: userId,
        }),
      });

      if (!ocrResponse.ok) {
        // Fallback to direct OCR.space if MCP bridge fails
        console.warn('MCP bridge OCR failed, falling back to OCR.space');
        return await this.fallbackOCRSpace(imageData);
      }

      const ocrData = await ocrResponse.json();

      if (!ocrData.ok) {
        throw new Error(ocrData.error || 'OCR processing failed');
      }

      // Convert MCP bridge response to our OCRResult format
      const result = this.convertMCPBridgeResult(ocrData.data);

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
   * Upload image to Supabase storage
   */
  private async uploadToSupabase(imageData: string | Buffer): Promise<string> {
    try {
      // Convert to buffer if needed
      let buffer: Buffer;

      if (typeof imageData === 'string') {
        if (imageData.startsWith('data:image')) {
          // Base64 data URL
          const base64 = imageData.split(',')[1];
          buffer = Buffer.from(base64, 'base64');
        } else if (imageData.startsWith('file://')) {
          // Local file path - read file
          const response = await fetch(imageData);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } else {
          // Assume it's already a base64 string
          buffer = Buffer.from(imageData, 'base64');
        }
      } else {
        buffer = imageData;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `receipt-${timestamp}.jpg`;

      // Upload to Supabase storage (receipts bucket)
      const { data, error } = await this.supabase.storage
        .from('receipts')
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Return storage path for MCP bridge
      return `receipts/${filename}`;
    } catch (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
  }

  /**
   * Convert MCP bridge response to our OCRResult format
   */
  private convertMCPBridgeResult(data: any): OCRResult {
    return {
      merchantName: data.merchant || null,
      amount: data.total || null,
      currency: data.currency || 'USD',
      date: data.date ? new Date(data.date) : null,
      category: this.inferCategory(data.merchant),
      taxAmount: data.tax || null,
      paymentMethod: null,
      confidence: (data.confidence || 0) / 100,
      rawText: data.ocr_text || '',
      metadata: {
        ocrProvider: 'ocr.space',
        ocrConfidence: data.ocr_confidence || 0.9,
        processingTime: 0,
        status: data.status,
      },
    };
  }

  /**
   * Fallback to direct OCR.space API if MCP bridge fails
   */
  private async fallbackOCRSpace(imageData: string | Buffer): Promise<OCRResult> {
    try {
      // Convert to base64 if needed
      let base64Image: string;

      if (typeof imageData === 'string') {
        if (imageData.startsWith('data:image')) {
          base64Image = imageData;
        } else {
          base64Image = `data:image/jpeg;base64,${imageData}`;
        }
      } else {
        base64Image = `data:image/jpeg;base64,${imageData.toString('base64')}`;
      }

      // Call OCR.space API directly
      const formData = new FormData();
      formData.append('apikey', OCRSPACE_API_KEY);
      formData.append('base64Image', base64Image);
      formData.append('language', 'eng');
      formData.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR.space API failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.IsErroredOnProcessing || !result.ParsedResults?.[0]) {
        throw new Error(result.ErrorMessage || 'OCR processing failed');
      }

      const parsedText = result.ParsedResults[0].ParsedText || '';

      // Simple extraction
      const amount = this.extractAmount({ text: parsedText });
      const merchant = parsedText.split('\n')[0] || null;

      return {
        merchantName: merchant,
        amount: amount.total,
        currency: this.detectCurrency({ text: parsedText }) || 'USD',
        date: null,
        category: this.inferCategory(merchant),
        taxAmount: amount.tax,
        paymentMethod: null,
        confidence: 0.7,
        rawText: parsedText,
        metadata: {
          ocrProvider: 'ocr.space-direct',
          ocrConfidence: 0.9,
          processingTime: 0,
        },
      };
    } catch (error) {
      console.error('Fallback OCR.space error:', error);
      throw error;
    }
  }

  /**
   * Infer category from merchant name
   */
  private inferCategory(merchantName: string | null): string | null {
    if (!merchantName) return null;

    const merchant = merchantName.toLowerCase();

    const categoryRules = [
      { keywords: ['restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner', 'starbucks', 'mcdonald'], category: 'Meals' },
      { keywords: ['hotel', 'motel', 'inn', 'accommodation', 'lodging', 'airbnb', 'hilton', 'marriott'], category: 'Accommodation' },
      { keywords: ['airline', 'flight', 'airport', 'boarding', 'airways', 'cebu pacific'], category: 'Travel' },
      { keywords: ['taxi', 'uber', 'lyft', 'grab', 'transport', 'bus', 'train', 'subway'], category: 'Transportation' },
      { keywords: ['office', 'staples', 'supplies', 'depot', 'stationery'], category: 'Office Supplies' },
      { keywords: ['training', 'course', 'conference', 'seminar', 'workshop'], category: 'Training' },
      { keywords: ['mobile', 'phone', 'internet', 'telecom', 'communication'], category: 'Communication' },
    ];

    for (const rule of categoryRules) {
      if (rule.keywords.some(keyword => merchant.includes(keyword))) {
        return rule.category;
      }
    }

    return 'Other';
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