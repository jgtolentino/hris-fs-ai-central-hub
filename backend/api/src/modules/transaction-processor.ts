import { z } from 'zod';
import OpenAI from 'openai';
import cv from '@techstark/opencv-js';

// Transaction item structure
export interface TransactionItem {
  brandName?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  isUnbranded: boolean;
  confidence: number;
  detectionMethod: 'stt' | 'ocr' | 'cv' | 'manual';
}

// STT (Speech-to-Text) Module for voice input
export class STTProcessor {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Process voice input for transaction items
  async processVoiceTransaction(audioBuffer: Buffer): Promise<TransactionItem[]> {
    // Step 1: Convert audio to text using Whisper
    const transcription = await this.transcribeAudio(audioBuffer);
    
    // Step 2: Parse transaction items using GPT
    const items = await this.parseTransactionItems(transcription);
    
    return items;
  }

  private async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // Example transcription result:
    // "Dalawang Coke 1.5 liter, tatlong Chippy, isang kilo bigas, 
    //  limang Lucky Me pancit canton, sampung itlog, isang dosena Red Horse"
    
    const response = await this.openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1",
      language: "fil", // Filipino/Tagalog
    });

    return response.text;
  }

  private async parseTransactionItems(transcription: string): Promise<TransactionItem[]> {
    const prompt = `
Parse this Filipino store transaction into structured items.
Identify: brand name (if any), product name, quantity, unit, and if it's unbranded.

Common Filipino units:
- piraso/pc (piece)
- kilo (kilogram)
- litro (liter)
- dosena (dozen)
- tali (bundle)
- pakete (packet)
- bote (bottle)
- lata (can)

Transcription: "${transcription}"

Return as JSON array with structure:
{
  brandName: string or null,
  productName: string,
  quantity: number,
  unit: string,
  isUnbranded: boolean
}
`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"items":[]}');
    
    // Example parsed result:
    return parsed.items.map((item: any) => ({
      ...item,
      confidence: 0.9,
      detectionMethod: 'stt',
      sku: this.generateSKU(item),
    }));
  }

  private generateSKU(item: any): string {
    // Generate SKU based on brand and product
    if (item.brandName) {
      return `${item.brandName.substring(0, 3).toUpperCase()}-${
        item.productName.substring(0, 4).toUpperCase()
      }-${Date.now().toString().slice(-6)}`;
    }
    // Unbranded items get generic SKU
    return `UNB-${item.productName.substring(0, 4).toUpperCase()}-${
      Date.now().toString().slice(-6)
    }`;
  }
}

// OpenCV Module for visual product detection
export class CVProcessor {
  private brandTemplates: Map<string, any> = new Map();
  private productDatabase: any[] = [];

  constructor() {
    this.loadBrandTemplates();
    this.loadProductDatabase();
  }

  async processReceiptImage(imageBuffer: Buffer): Promise<TransactionItem[]> {
    // Step 1: Preprocess image
    const processedImage = await this.preprocessImage(imageBuffer);
    
    // Step 2: Detect products and brands
    const detectedItems = await this.detectProducts(processedImage);
    
    // Step 3: Extract text using OCR for verification
    const ocrResults = await this.performOCR(processedImage);
    
    // Step 4: Merge CV and OCR results
    const mergedItems = this.mergeResults(detectedItems, ocrResults);
    
    return mergedItems;
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<any> {
    // Convert to OpenCV format
    const image = cv.imdecode(imageBuffer);
    
    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply adaptive threshold for better text detection
    const binary = new cv.Mat();
    cv.adaptiveThreshold(
      gray, 
      binary, 
      255, 
      cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
      cv.THRESH_BINARY, 
      11, 
      2
    );
    
    return { original: image, processed: binary };
  }

  private async detectProducts(image: any): Promise<any[]> {
    const detectedItems: any[] = [];
    
    // Template matching for known brands
    this.brandTemplates.forEach((template, brandName) => {
      const result = new cv.Mat();
      cv.matchTemplate(
        image.processed, 
        template, 
        result, 
        cv.TM_CCOEFF_NORMED
      );
      
      // Find matches above threshold
      const threshold = 0.8;
      const matches = this.findMatches(result, threshold);
      
      matches.forEach(match => {
        detectedItems.push({
          brandName,
          confidence: match.confidence,
          boundingBox: match.rect,
          detectionMethod: 'cv',
        });
      });
    });
    
    // Detect unbranded items using shape/text detection
    const unbrandedItems = this.detectUnbrandedItems(image);
    detectedItems.push(...unbrandedItems);
    
    return detectedItems;
  }

  private detectUnbrandedItems(image: any): any[] {
    const items: any[] = [];
    
    // Find contours for product shapes
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      image.processed,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );
    
    // Analyze each contour
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // Filter by minimum area
      if (area > 1000) {
        const rect = cv.boundingRect(contour);
        
        // Check if this region likely contains product info
        if (this.isLikelyProduct(image, rect)) {
          items.push({
            brandName: null,
            isUnbranded: true,
            confidence: 0.7,
            boundingBox: rect,
            detectionMethod: 'cv',
          });
        }
      }
    }
    
    return items;
  }

  private async performOCR(image: any): Promise<any[]> {
    // Use Tesseract or cloud OCR service
    // This would extract text including:
    // - Product names
    // - Quantities
    // - Prices
    // - Units (kg, L, pcs, etc.)
    
    return [
      {
        text: "COKE 1.5L",
        boundingBox: { x: 100, y: 200, width: 150, height: 30 },
        confidence: 0.95,
      },
      {
        text: "2 PCS",
        boundingBox: { x: 260, y: 200, width: 80, height: 30 },
        confidence: 0.92,
      },
      {
        text: "BIGAS 1KG", // Unbranded rice
        boundingBox: { x: 100, y: 250, width: 150, height: 30 },
        confidence: 0.88,
      },
    ];
  }

  private mergeResults(cvItems: any[], ocrItems: any[]): TransactionItem[] {
    const mergedItems: TransactionItem[] = [];
    
    // Match CV detections with OCR text
    cvItems.forEach(cvItem => {
      const nearbyText = ocrItems.filter(ocrItem => 
        this.isNearby(cvItem.boundingBox, ocrItem.boundingBox)
      );
      
      // Parse quantity and units from nearby text
      const quantity = this.extractQuantity(nearbyText);
      const unit = this.extractUnit(nearbyText);
      const productName = this.extractProductName(nearbyText, cvItem.brandName);
      
      mergedItems.push({
        brandName: cvItem.brandName,
        productName,
        quantity,
        unit,
        isUnbranded: cvItem.isUnbranded || false,
        confidence: (cvItem.confidence + 
          nearbyText.reduce((sum, t) => sum + t.confidence, 0) / nearbyText.length) / 2,
        detectionMethod: 'cv',
        sku: this.generateSKU({
          brandName: cvItem.brandName,
          productName,
        }),
      });
    });
    
    return mergedItems;
  }

  private loadBrandTemplates() {
    // Load pre-trained templates for common brands
    // These would be small image patches of brand logos
    const brands = [
      'Coca-Cola', 'Pepsi', 'Lucky Me', 'Argentina',
      'Chippy', 'San Miguel', 'Red Horse', 'Tanduay',
      'Nestle', 'Alaska', 'Birch Tree', 'Bear Brand',
    ];
    
    // In production, load actual image templates
    brands.forEach(brand => {
      // this.brandTemplates.set(brand, cv.imread(`templates/${brand}.png`));
    });
  }

  private loadProductDatabase() {
    // Load known products with their typical attributes
    this.productDatabase = [
      { name: 'Coke', variants: ['1.5L', '500ml', 'Litro'], category: 'beverage' },
      { name: 'Rice', variants: ['1kg', '5kg', '25kg'], category: 'staple', usuallyUnbranded: true },
      { name: 'Egg', variants: ['dozen', 'tray'], category: 'fresh', usuallyUnbranded: true },
      { name: 'Oil', variants: ['1L', '500ml'], category: 'cooking' },
    ];
  }

  private isNearby(box1: any, box2: any): boolean {
    // Check if two bounding boxes are close to each other
    const distance = Math.sqrt(
      Math.pow(box1.x - box2.x, 2) + 
      Math.pow(box1.y - box2.y, 2)
    );
    return distance < 100; // pixels
  }

  private extractQuantity(textItems: any[]): number {
    // Extract quantity from text
    const quantityPatterns = [
      /(\d+)\s*(pcs?|pieces?|piraso)/i,
      /(\d+)\s*(kg|kilo|kilogram)/i,
      /(\d+)\s*(L|liter|litro)/i,
      /(\d+)\s*(dozen|dosena)/i,
      /(\d+)\s*(pack|pakete)/i,
    ];
    
    for (const item of textItems) {
      for (const pattern of quantityPatterns) {
        const match = item.text.match(pattern);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
    
    return 1; // Default quantity
  }

  private extractUnit(textItems: any[]): string {
    // Map Filipino units to standard units
    const unitMappings = {
      'piraso': 'pc',
      'kilo': 'kg',
      'litro': 'L',
      'dosena': 'dozen',
      'tali': 'bundle',
      'pakete': 'pack',
      'bote': 'bottle',
      'lata': 'can',
    };
    
    for (const item of textItems) {
      const text = item.text.toLowerCase();
      for (const [filipino, standard] of Object.entries(unitMappings)) {
        if (text.includes(filipino)) {
          return standard;
        }
      }
    }
    
    return 'pc'; // Default unit
  }

  private extractProductName(textItems: any[], brandName?: string): string {
    // Extract product name, removing brand if already detected
    let productText = textItems.map(t => t.text).join(' ');
    
    if (brandName) {
      productText = productText.replace(new RegExp(brandName, 'gi'), '').trim();
    }
    
    // Clean up common patterns
    productText = productText
      .replace(/\d+\s*(pcs?|kg|L|ml)/gi, '')
      .replace(/[₱$]\s*[\d,]+\.?\d*/g, '')
      .trim();
    
    return productText || 'Unknown Product';
  }

  private generateSKU(item: any): string {
    if (item.brandName) {
      return `${item.brandName.substring(0, 3).toUpperCase()}-${
        item.productName.substring(0, 4).toUpperCase()
      }-${Date.now().toString().slice(-6)}`;
    }
    return `UNB-${item.productName.substring(0, 4).toUpperCase()}-${
      Date.now().toString().slice(-6)
    }`;
  }

  private isLikelyProduct(image: any, rect: any): boolean {
    // Analyze if a region likely contains product information
    // Check for text density, shape regularity, etc.
    return true; // Simplified
  }

  private findMatches(result: any, threshold: number): any[] {
    // Find all matches above threshold
    const matches: any[] = [];
    // Implementation would scan the result matrix
    return matches;
  }
}