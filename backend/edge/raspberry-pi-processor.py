#!/usr/bin/env python3
"""
Raspberry Pi Edge Transaction Processor
Real-time STT + OpenCV processing for sari-sari store transactions
Outputs JSON to central hub via API calls
"""

import json
import cv2
import numpy as np
import speech_recognition as sr
import requests
import time
from datetime import datetime
from typing import List, Dict, Optional
import threading
import queue
import os
from dataclasses import dataclass, asdict
import logging
from PIL import Image
import pytesseract
import whisper
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TransactionItem:
    brandName: Optional[str]
    productName: str
    genericName: Optional[str]
    localName: Optional[str]
    sku: Optional[str]
    quantity: int
    unit: str
    unitPrice: float
    totalPrice: float
    category: str
    isUnbranded: bool
    isBulk: bool
    detectionMethod: str
    confidence: float
    brandConfidence: Optional[float] = None
    suggestedBrands: Optional[List[str]] = None
    notes: Optional[str] = None

@dataclass
class TransactionOutput:
    storeId: str
    deviceId: str
    timestamp: str
    transactionId: str
    items: List[TransactionItem]
    totals: Dict[str, float]
    insights: Dict[str, any]
    paymentMethod: str
    processingTime: float
    edgeVersion: str

class RaspberryPiProcessor:
    def __init__(self):
        self.store_id = os.getenv('STORE_ID', 'SM-001')
        self.device_id = os.getenv('DEVICE_ID', 'RPI-001')
        self.api_endpoint = os.getenv('API_ENDPOINT', 'http://localhost:4000')
        self.edge_version = "v1.0.0"
        
        # Initialize components
        self.audio_queue = queue.Queue()
        self.image_queue = queue.Queue()
        self.result_queue = queue.Queue()
        
        # Load models
        self.whisper_model = whisper.load_model("base")
        self.brand_templates = self.load_brand_templates()
        self.product_database = self.load_product_database()
        
        # Filipino units mapping
        self.filipino_units = {
            'piraso': 'pc',
            'kilo': 'kg', 
            'litro': 'L',
            'dosena': 'dozen',
            'tali': 'bundle',
            'pakete': 'pack',
            'bote': 'bottle',
            'lata': 'can',
            'sakto': 'sachet'
        }
        
        # Common Filipino product patterns
        self.filipino_patterns = {
            'bigas': {'generic': 'Rice', 'category': 'staple', 'unbranded': True},
            'itlog': {'generic': 'Eggs', 'category': 'fresh', 'unbranded': True},
            'mantika': {'generic': 'Cooking Oil', 'category': 'cooking', 'unbranded': True},
            'asin': {'generic': 'Salt', 'category': 'seasoning', 'unbranded': True},
            'asukal': {'generic': 'Sugar', 'category': 'seasoning', 'unbranded': True},
            'gatas': {'generic': 'Milk', 'category': 'dairy', 'unbranded': True},
            'tinapay': {'generic': 'Bread', 'category': 'bakery', 'unbranded': True},
        }
        
        logger.info(f"Initialized Raspberry Pi Processor for store {self.store_id}")

    def start_processing(self):
        """Start all processing threads"""
        logger.info("Starting edge processing threads...")
        
        # Start audio processing thread
        audio_thread = threading.Thread(target=self.audio_processor, daemon=True)
        audio_thread.start()
        
        # Start image processing thread
        image_thread = threading.Thread(target=self.image_processor, daemon=True)
        image_thread.start()
        
        # Start result sender thread
        sender_thread = threading.Thread(target=self.result_sender, daemon=True)
        sender_thread.start()
        
        logger.info("All threads started. Ready for transactions.")
        
        # Main loop
        try:
            while True:
                self.listen_for_input()
                time.sleep(0.1)
        except KeyboardInterrupt:
            logger.info("Shutting down...")

    def listen_for_input(self):
        """Listen for voice input or image capture"""
        # Simulate voice input detection
        # In real implementation, this would use microphone
        pass

    def process_voice_transaction(self, audio_data: bytes) -> List[TransactionItem]:
        """Process voice input using Whisper STT"""
        start_time = time.time()
        
        try:
            # Transcribe audio using Whisper
            result = self.whisper_model.transcribe(audio_data, language="fil")
            transcription = result["text"]
            
            logger.info(f"Transcribed: {transcription}")
            
            # Parse Filipino transaction
            items = self.parse_filipino_transaction(transcription)
            
            processing_time = time.time() - start_time
            logger.info(f"Voice processing completed in {processing_time:.2f}s")
            
            return items
            
        except Exception as e:
            logger.error(f"Voice processing error: {e}")
            return []

    def parse_filipino_transaction(self, transcription: str) -> List[TransactionItem]:
        """Parse Filipino transaction text into structured items"""
        items = []
        
        # Common Filipino number words
        number_words = {
            'isa': 1, 'dalawa': 2, 'tatlo': 3, 'apat': 4, 'lima': 5,
            'anim': 6, 'pito': 7, 'walo': 8, 'siyam': 9, 'sampu': 10,
            'labing-isa': 11, 'labindalawa': 12, 'dalawampu': 20,
            'tatlumpu': 30, 'apatnapu': 40, 'limampu': 50
        }
        
        # Split by common separators
        segments = re.split(r'[,.]|\s+at\s+|\s+tsaka\s+', transcription.lower())
        
        for segment in segments:
            segment = segment.strip()
            if not segment:
                continue
                
            item = self.parse_transaction_segment(segment, number_words)
            if item:
                items.append(item)
        
        return items

    def parse_transaction_segment(self, segment: str, number_words: dict) -> Optional[TransactionItem]:
        """Parse individual transaction segment"""
        
        # Extract quantity
        quantity = 1
        for word, num in number_words.items():
            if word in segment:
                quantity = num
                segment = segment.replace(word, '').strip()
                break
        
        # Check for numeric quantity
        qty_match = re.search(r'(\d+)', segment)
        if qty_match:
            quantity = int(qty_match.group(1))
            segment = re.sub(r'\d+', '', segment).strip()
        
        # Extract unit
        unit = 'pc'
        for filipino_unit, standard_unit in self.filipino_units.items():
            if filipino_unit in segment:
                unit = standard_unit
                segment = segment.replace(filipino_unit, '').strip()
                break
        
        # Identify product
        product_info = self.identify_product(segment)
        if not product_info:
            return None
        
        # Estimate price (in real implementation, this would come from POS or database)
        unit_price = self.estimate_price(product_info, unit)
        
        return TransactionItem(
            brandName=product_info.get('brand'),
            productName=product_info['name'],
            genericName=product_info.get('generic'),
            localName=product_info.get('local'),
            sku=self.generate_sku(product_info),
            quantity=quantity,
            unit=unit,
            unitPrice=unit_price,
            totalPrice=unit_price * quantity,
            category=product_info['category'],
            isUnbranded=product_info.get('unbranded', False),
            isBulk=quantity > 10 and unit in ['kg', 'L'],
            detectionMethod='stt',
            confidence=0.85,
            suggestedBrands=product_info.get('suggested_brands', [])
        )

    def identify_product(self, text: str) -> Optional[Dict]:
        """Identify product from text"""
        text = text.lower().strip()
        
        # Check against Filipino patterns first
        for local_name, info in self.filipino_patterns.items():
            if local_name in text:
                return {
                    'name': info['generic'],
                    'local': local_name,
                    'generic': info['generic'],
                    'category': info['category'],
                    'unbranded': info['unbranded']
                }
        
        # Check against brand database
        for product in self.product_database:
            if any(variant.lower() in text for variant in product['variants']):
                return {
                    'name': product['name'],
                    'brand': product.get('brand'),
                    'category': product['category'],
                    'unbranded': False
                }
        
        # Generic product detection
        if 'coke' in text or 'cola' in text:
            return {
                'name': 'Coke 1.5L',
                'brand': 'Coca-Cola',
                'category': 'beverage',
                'unbranded': False
            }
        
        return None

    def process_image_transaction(self, image_data: bytes) -> List[TransactionItem]:
        """Process receipt image using OpenCV + OCR"""
        start_time = time.time()
        
        try:
            # Convert bytes to OpenCV image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Preprocess image
            processed_img = self.preprocess_image(img)
            
            # Detect brands using template matching
            detected_brands = self.detect_brands(processed_img)
            
            # Extract text using OCR
            ocr_text = self.extract_text_tesseract(processed_img)
            
            # Parse transaction items
            items = self.parse_receipt_text(ocr_text, detected_brands)
            
            processing_time = time.time() - start_time
            logger.info(f"Image processing completed in {processing_time:.2f}s")
            
            return items
            
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return []

    def preprocess_image(self, img):
        """Preprocess image for better OCR"""
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive threshold
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Noise reduction
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return cleaned

    def extract_text_tesseract(self, img):
        """Extract text using Tesseract OCR"""
        # Configure Tesseract for Filipino text
        config = '--oem 3 --psm 6 -l eng+fil'
        
        # Extract text
        text = pytesseract.image_to_string(img, config=config)
        
        return text

    def generate_transaction_json(self, items: List[TransactionItem], 
                                processing_time: float) -> Dict:
        """Generate final JSON output"""
        
        transaction_id = f"TXN-{int(time.time())}"
        timestamp = datetime.now().isoformat()
        
        # Calculate totals
        branded_items = [item for item in items if not item.isUnbranded]
        unbranded_items = [item for item in items if item.isUnbranded]
        
        totals = {
            'totalAmount': sum(item.totalPrice for item in items),
            'totalItems': sum(item.quantity for item in items),
            'brandedAmount': sum(item.totalPrice for item in branded_items),
            'unbrandedAmount': sum(item.totalPrice for item in unbranded_items),
            'brandedCount': len(branded_items),
            'unbrandedCount': len(unbranded_items)
        }
        
        # Generate insights
        insights = self.generate_insights(items)
        
        # Create final output
        output = TransactionOutput(
            storeId=self.store_id,
            deviceId=self.device_id,
            timestamp=timestamp,
            transactionId=transaction_id,
            items=items,
            totals=totals,
            insights=insights,
            paymentMethod='cash',  # Default, could be detected
            processingTime=processing_time,
            edgeVersion=self.edge_version
        )
        
        return asdict(output)

    def send_to_api(self, transaction_data: Dict) -> bool:
        """Send transaction data to central API"""
        try:
            response = requests.post(
                f"{self.api_endpoint}/api/transactions",
                json=transaction_data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Transaction sent successfully: {transaction_data['transactionId']}")
                return True
            else:
                logger.error(f"API error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send transaction: {e}")
            return False

    def audio_processor(self):
        """Background audio processing thread"""
        while True:
            try:
                if not self.audio_queue.empty():
                    audio_data = self.audio_queue.get()
                    items = self.process_voice_transaction(audio_data)
                    
                    if items:
                        json_output = self.generate_transaction_json(items, 0.5)
                        self.result_queue.put(json_output)
                        
                        # Print JSON to console
                        print(json.dumps(json_output, indent=2, default=str))
                        
            except Exception as e:
                logger.error(f"Audio processor error: {e}")
            
            time.sleep(0.1)

    def image_processor(self):
        """Background image processing thread"""
        while True:
            try:
                if not self.image_queue.empty():
                    image_data = self.image_queue.get()
                    items = self.process_image_transaction(image_data)
                    
                    if items:
                        json_output = self.generate_transaction_json(items, 1.2)
                        self.result_queue.put(json_output)
                        
                        # Print JSON to console
                        print(json.dumps(json_output, indent=2, default=str))
                        
            except Exception as e:
                logger.error(f"Image processor error: {e}")
            
            time.sleep(0.1)

    def result_sender(self):
        """Background result sender thread"""
        while True:
            try:
                if not self.result_queue.empty():
                    transaction_data = self.result_queue.get()
                    success = self.send_to_api(transaction_data)
                    
                    if not success:
                        # Store locally for retry
                        self.store_offline(transaction_data)
                        
            except Exception as e:
                logger.error(f"Result sender error: {e}")
            
            time.sleep(1)

    def store_offline(self, transaction_data: Dict):
        """Store transaction offline for later sync"""
        offline_dir = "/tmp/offline_transactions"
        os.makedirs(offline_dir, exist_ok=True)
        
        filename = f"{offline_dir}/{transaction_data['transactionId']}.json"
        with open(filename, 'w') as f:
            json.dump(transaction_data, f, indent=2, default=str)
        
        logger.info(f"Stored offline: {filename}")

    def load_brand_templates(self) -> Dict:
        """Load brand templates for CV detection"""
        return {
            'Coca-Cola': 'template_coke.png',
            'Pepsi': 'template_pepsi.png',
            'Lucky Me': 'template_lucky_me.png',
            'Jack n Jill': 'template_jnj.png',
        }

    def load_product_database(self) -> List[Dict]:
        """Load product database"""
        return [
            {
                'name': 'Coke',
                'brand': 'Coca-Cola',
                'variants': ['Coke', 'Coca-Cola', '1.5L', 'Litro'],
                'category': 'beverage',
                'price_range': [55, 75]
            },
            {
                'name': 'Pancit Canton',
                'brand': 'Lucky Me',
                'variants': ['Lucky Me', 'Canton', 'Pancit'],
                'category': 'food',
                'price_range': [12, 18]
            },
            {
                'name': 'Chippy',
                'brand': 'Jack n Jill',
                'variants': ['Chippy', 'Jack'],
                'category': 'snacks',
                'price_range': [20, 30]
            }
        ]

    def estimate_price(self, product_info: Dict, unit: str) -> float:
        """Estimate product price based on database"""
        # In real implementation, this would query local price database
        base_prices = {
            'beverage': 65.0,
            'food': 15.0,
            'snacks': 25.0,
            'staple': 55.0,
            'fresh': 8.0,
            'cooking': 85.0
        }
        
        return base_prices.get(product_info['category'], 20.0)

    def generate_sku(self, product_info: Dict) -> str:
        """Generate SKU for product"""
        if product_info.get('brand'):
            brand_code = product_info['brand'][:3].upper()
            product_code = product_info['name'][:4].upper()
            return f"{brand_code}-{product_code}-{int(time.time()) % 1000000}"
        else:
            return f"UNB-{product_info['name'][:4].upper()}-{int(time.time()) % 1000000}"

    def generate_insights(self, items: List[TransactionItem]) -> Dict:
        """Generate transaction insights"""
        return {
            'brandedVsUnbranded': {
                'brandedPercentage': len([i for i in items if not i.isUnbranded]) / len(items) * 100,
                'unbrandedPercentage': len([i for i in items if i.isUnbranded]) / len(items) * 100
            },
            'topCategories': self.get_top_categories(items),
            'suggestions': self.get_suggestions(items)
        }

    def get_top_categories(self, items: List[TransactionItem]) -> List[Dict]:
        """Get top categories by count"""
        categories = {}
        for item in items:
            if item.category not in categories:
                categories[item.category] = {'count': 0, 'value': 0}
            categories[item.category]['count'] += item.quantity
            categories[item.category]['value'] += item.totalPrice
        
        return sorted(
            [{'category': k, **v} for k, v in categories.items()],
            key=lambda x: x['value'],
            reverse=True
        )

    def get_suggestions(self, items: List[TransactionItem]) -> List[str]:
        """Get upsell suggestions"""
        suggestions = []
        
        # Check for common combinations
        has_rice = any('rice' in item.productName.lower() for item in items)
        has_oil = any('oil' in item.productName.lower() for item in items)
        
        if has_rice and not has_oil:
            suggestions.append("Suggest cooking oil with rice purchase")
        
        return suggestions

    def detect_brands(self, img) -> List[Dict]:
        """Detect brands using template matching"""
        # Simplified brand detection
        return []

    def parse_receipt_text(self, text: str, brands: List[Dict]) -> List[TransactionItem]:
        """Parse receipt text into items"""
        items = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or 'TOTAL' in line.upper():
                continue
            
            # Simple parsing - in real implementation would be more sophisticated
            parts = line.split()
            if len(parts) >= 2:
                try:
                    quantity = int(parts[0])
                    product_name = ' '.join(parts[1:-1])
                    price = float(parts[-1])
                    
                    item = TransactionItem(
                        brandName=None,
                        productName=product_name,
                        genericName=product_name,
                        localName=None,
                        sku=f"OCR-{int(time.time()) % 1000000}",
                        quantity=quantity,
                        unit='pc',
                        unitPrice=price / quantity,
                        totalPrice=price,
                        category='unknown',
                        isUnbranded=True,
                        isBulk=False,
                        detectionMethod='ocr',
                        confidence=0.8
                    )
                    items.append(item)
                except (ValueError, IndexError):
                    continue
        
        return items

def main():
    """Main function to run the Raspberry Pi processor"""
    processor = RaspberryPiProcessor()
    
    # Example usage - simulate a transaction
    print("=== RASPBERRY PI TRANSACTION PROCESSOR ===")
    print("Simulating Filipino voice transaction...")
    
    # Simulate voice input
    sample_transcription = "Dalawang Coke 1.5 litro, tatlong Lucky Me pancit canton, isang kilo bigas, sampung itlog"
    items = processor.parse_filipino_transaction(sample_transcription)
    
    if items:
        json_output = processor.generate_transaction_json(items, 0.8)
        print("\n=== JSON OUTPUT ===")
        print(json.dumps(json_output, indent=2, default=str))
    
    # Start real-time processing
    # processor.start_processing()

if __name__ == "__main__":
    main()