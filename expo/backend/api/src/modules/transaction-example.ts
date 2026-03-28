// Example: Processing a typical sari-sari store transaction

export interface ProcessedTransaction {
  storeId: string;
  timestamp: Date;
  items: TransactionItem[];
  total: number;
  paymentMethod: string;
  insights: TransactionInsights;
}

export interface TransactionItem {
  // Identification
  brandName?: string;        // "Coca-Cola", "Lucky Me", null for unbranded
  productName: string;       // "Coke 1.5L", "Pancit Canton", "Rice", "Eggs"
  genericName?: string;      // "Soft Drink", "Instant Noodles", "Rice", "Eggs"
  sku?: string;             // "COC-COKE-123456" or "UNB-RICE-789012"
  
  // Quantity & Pricing
  quantity: number;          // 2, 5, 1
  unit: string;             // "pc", "kg", "L", "dozen"
  unitPrice: number;        // 65.00, 15.00, 55.00
  totalPrice: number;       // 130.00, 75.00, 55.00
  
  // Classification
  category: string;         // "beverage", "food", "staple"
  isUnbranded: boolean;     // false for Coke, true for rice/eggs
  isBulk: boolean;         // true for "1 sack rice", false for "1kg rice"
  
  // Detection metadata
  detectionMethod: 'stt' | 'ocr' | 'cv' | 'manual' | 'hybrid';
  confidence: number;       // 0.95 for clear brands, 0.70 for unbranded
  brandConfidence?: number; // Confidence in brand detection
  
  // Additional insights
  localName?: string;       // "bigas", "itlog", "mantika"
  suggestedBrands?: string[]; // For unbranded: ["Ganador", "Angelica", "Jasmine"]
}

export interface TransactionInsights {
  brandedVsUnbranded: {
    brandedCount: number;
    unbrandedCount: number;
    brandedValue: number;
    unbrandedValue: number;
  };
  topCategories: Array<{ category: string; count: number; value: number }>;
  suggestedUpsells: string[];
  priceAnomalies: string[];
}

// EXAMPLE 1: Voice Input Processing (STT)
export const voiceTransactionExample = {
  // Filipino voice input: 
  // "Dalawang Coke 1.5 litro, tatlong Lucky Me pancit canton, 
  //  isang kilo bigas, sampung itlog, dalawang Chippy"
  
  audioTranscription: "Dalawang Coke 1.5 litro, tatlong Lucky Me pancit canton, isang kilo bigas, sampung itlog, dalawang Chippy",
  
  processedItems: [
    {
      brandName: "Coca-Cola",
      productName: "Coke 1.5L",
      genericName: "Soft Drink",
      sku: "COC-COKE-945821",
      quantity: 2,
      unit: "pc",
      unitPrice: 65.00,
      totalPrice: 130.00,
      category: "beverage",
      isUnbranded: false,
      isBulk: false,
      detectionMethod: "stt",
      confidence: 0.95,
      brandConfidence: 0.98,
    },
    {
      brandName: "Lucky Me",
      productName: "Pancit Canton",
      genericName: "Instant Noodles",
      sku: "LUC-PANC-167234",
      quantity: 3,
      unit: "pc",
      unitPrice: 15.00,
      totalPrice: 45.00,
      category: "food",
      isUnbranded: false,
      isBulk: false,
      detectionMethod: "stt",
      confidence: 0.93,
      brandConfidence: 0.96,
    },
    {
      brandName: null,
      productName: "Rice",
      genericName: "Rice",
      localName: "Bigas",
      sku: "UNB-RICE-823451",
      quantity: 1,
      unit: "kg",
      unitPrice: 55.00,
      totalPrice: 55.00,
      category: "staple",
      isUnbranded: true,
      isBulk: false,
      detectionMethod: "stt",
      confidence: 0.85,
      suggestedBrands: ["Ganador", "Sinandomeng", "Jasmine"],
    },
    {
      brandName: null,
      productName: "Eggs",
      genericName: "Eggs",
      localName: "Itlog",
      sku: "UNB-EGGS-234567",
      quantity: 10,
      unit: "pc",
      unitPrice: 8.00,
      totalPrice: 80.00,
      category: "fresh",
      isUnbranded: true,
      isBulk: false,
      detectionMethod: "stt",
      confidence: 0.88,
      suggestedBrands: ["Bounty Fresh", "Farm Fresh"],
    },
    {
      brandName: "Jack 'n Jill",
      productName: "Chippy",
      genericName: "Chips",
      sku: "JAC-CHIP-456789",
      quantity: 2,
      unit: "pc",
      unitPrice: 25.00,
      totalPrice: 50.00,
      category: "snacks",
      isUnbranded: false,
      isBulk: false,
      detectionMethod: "stt",
      confidence: 0.91,
      brandConfidence: 0.94,
    }
  ],
  
  insights: {
    brandedVsUnbranded: {
      brandedCount: 7,  // 2 Coke + 3 Lucky Me + 2 Chippy
      unbrandedCount: 11, // 1kg rice + 10 eggs
      brandedValue: 225.00, // 130 + 45 + 50
      unbrandedValue: 135.00, // 55 + 80
    },
    topCategories: [
      { category: "beverage", count: 2, value: 130.00 },
      { category: "fresh", count: 10, value: 80.00 },
      { category: "staple", count: 1, value: 55.00 },
    ],
    suggestedUpsells: [
      "Suggest Knorr cubes with Lucky Me",
      "Suggest cooking oil with rice",
      "Suggest bread with eggs"
    ],
    priceAnomalies: []
  }
};

// EXAMPLE 2: Receipt OCR + Computer Vision Processing
export const receiptProcessingExample = {
  // Image contains both clear brand logos and text items
  
  ocrExtractedText: [
    "SARI-SARI STORE NI ALING NENA",
    "BRGY POBLACION, QUEZON CITY",
    "------------------------",
    "2  COKE 1.5L          130.00",
    "3  LUCKY ME PC         45.00",
    "1  RICE KG            55.00",
    "10 EGGS PC            80.00",
    "2  CHIPPY             50.00",
    "1  MANTIKA 1L         85.00",  // Cooking oil - unbranded
    "5  SKYFLAKES          75.00",  // Branded
    "------------------------",
    "TOTAL:               520.00",
    "CASH:                520.00",
  ],
  
  cvDetectedBrands: [
    { brand: "Coca-Cola", confidence: 0.98, bbox: { x: 50, y: 120 } },
    { brand: "Lucky Me", confidence: 0.95, bbox: { x: 50, y: 140 } },
    { brand: "Jack 'n Jill", confidence: 0.92, bbox: { x: 50, y: 200 } },
    { brand: "SkyFlakes", confidence: 0.94, bbox: { x: 50, y: 240 } },
  ],
  
  processedItems: [
    // Items with both CV logo detection and OCR text
    {
      brandName: "Coca-Cola",
      productName: "Coke 1.5L",
      detectionMethod: "hybrid", // Both CV and OCR
      confidence: 0.97, // Average of CV (0.98) and OCR (0.96)
      brandConfidence: 0.98,
    },
    // Unbranded item detected only by OCR
    {
      brandName: null,
      productName: "Cooking Oil",
      genericName: "Cooking Oil",
      localName: "Mantika",
      quantity: 1,
      unit: "L",
      unitPrice: 85.00,
      category: "cooking",
      isUnbranded: true,
      detectionMethod: "ocr",
      confidence: 0.82,
      suggestedBrands: ["Baguio Oil", "Minola", "Golden Fiesta"],
    }
  ]
};

// EXAMPLE 3: Handling Mixed and Bulk Transactions
export const complexTransactionExample = {
  items: [
    // Bulk unbranded item
    {
      brandName: null,
      productName: "Rice",
      localName: "Bigas",
      quantity: 25,
      unit: "kg",
      unitPrice: 52.00, // Bulk price per kg
      totalPrice: 1300.00,
      category: "staple",
      isUnbranded: true,
      isBulk: true, // Sack of rice
      detectionMethod: "manual",
      notes: "1 sack Mindoro rice"
    },
    // Mixed brands in one category
    {
      brandName: "Nestle",
      productName: "Bear Brand Adult Plus",
      quantity: 1,
      unit: "pc",
      category: "dairy",
      isUnbranded: false,
    },
    {
      brandName: "Alaska",
      productName: "Evaporada",
      quantity: 2,
      unit: "pc",
      category: "dairy",
      isUnbranded: false,
    },
    {
      brandName: null,
      productName: "Fresh Milk",
      localName: "Gatas",
      quantity: 1,
      unit: "L",
      category: "dairy",
      isUnbranded: true,
      notes: "Local carabao milk"
    }
  ]
};

// EXAMPLE 4: Analytics Output
export const transactionAnalytics = {
  dailySummary: {
    totalTransactions: 156,
    brandedItemsSold: 892,
    unbrandedItemsSold: 234,
    brandedRevenue: 45680.00,
    unbrandedRevenue: 12340.00,
    
    topBrands: [
      { brand: "Coca-Cola", units: 89, revenue: 5785.00 },
      { brand: "Lucky Me", units: 156, revenue: 2340.00 },
      { brand: "San Miguel", units: 45, revenue: 3150.00 },
    ],
    
    topUnbrandedCategories: [
      { category: "rice", units: 45, revenue: 2475.00 },
      { category: "eggs", units: 120, revenue: 960.00 },
      { category: "vegetables", units: 89, revenue: 890.00 },
    ],
    
    paymentMethods: {
      cash: 134,
      gcash: 18,
      utang: 4, // Store credit
    }
  },
  
  insights: [
    "Unbranded rice accounts for 20% of revenue but 35% of volume",
    "Coca-Cola products show 15% higher sales on weekends",
    "Cooking oil is 90% unbranded - opportunity for brand partnerships",
    "Morning transactions (6-10am) are 70% unbranded staples",
    "Afternoon transactions (2-6pm) are 80% branded snacks/beverages"
  ]
};