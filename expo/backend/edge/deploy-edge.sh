#!/bin/bash

# Raspberry Pi Edge Deployment Script
# Deploys transaction processor to Raspberry Pi devices

echo "🥧 Raspberry Pi Edge Deployment"
echo "================================"

# Configuration
PI_USER="pi"
PI_HOST="${1:-192.168.1.100}"  # Default IP or pass as argument
STORE_ID="${2:-SM-001}"
DEVICE_ID="${3:-RPI-001}"
API_ENDPOINT="${4:-http://10.0.0.1:4000}"  # Central server IP

echo "Deploying to: $PI_USER@$PI_HOST"
echo "Store ID: $STORE_ID"
echo "Device ID: $DEVICE_ID"
echo "API Endpoint: $API_ENDPOINT"

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p dist/edge
cp raspberry-pi-processor.py dist/edge/
cp requirements-edge.txt dist/edge/requirements.txt
cp -r templates/ dist/edge/ 2>/dev/null || true
cp -r models/ dist/edge/ 2>/dev/null || true

# Create systemd service file
cat > dist/edge/transaction-processor.service << EOF
[Unit]
Description=TBWA Transaction Processor
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/transaction-processor
Environment=STORE_ID=$STORE_ID
Environment=DEVICE_ID=$DEVICE_ID
Environment=API_ENDPOINT=$API_ENDPOINT
Environment=PYTHONPATH=/home/pi/transaction-processor
ExecStart=/home/pi/transaction-processor/venv/bin/python raspberry-pi-processor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create installation script
cat > dist/edge/install.sh << 'EOF'
#!/bin/bash

echo "🚀 Installing Transaction Processor..."

# Update system
sudo apt update
sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y libopencv-dev python3-opencv
sudo apt install -y tesseract-ocr tesseract-ocr-fil
sudo apt install -y portaudio19-dev python3-pyaudio
sudo apt install -y libatlas-base-dev
sudo apt install -y alsa-utils

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install PyTorch for Raspberry Pi
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Setup directories
mkdir -p templates models logs offline_transactions

# Copy systemd service
sudo cp transaction-processor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable transaction-processor
sudo systemctl start transaction-processor

# Setup audio permissions
sudo usermod -a -G audio pi

echo "✅ Installation complete!"
echo "Service status:"
sudo systemctl status transaction-processor
EOF

chmod +x dist/edge/install.sh

# Create requirements file
cat > dist/edge/requirements.txt << EOF
# Core dependencies
opencv-python==4.8.0.74
numpy==1.24.3
Pillow==9.5.0
requests==2.31.0

# Speech recognition
SpeechRecognition==3.10.0
PyAudio==0.2.11
openai-whisper==20230314

# OCR
pytesseract==0.3.10

# Audio processing
pyaudio==0.2.11
wave==0.0.2

# Utilities
python-dotenv==1.0.0
pyyaml==6.0
schedule==1.2.0
EOF

# Create configuration template
cat > dist/edge/config.yaml << EOF
store:
  id: $STORE_ID
  name: "Sample Sari-Sari Store"
  location: "Brgy. Poblacion, Quezon City"
  timezone: "Asia/Manila"

device:
  id: $DEVICE_ID
  type: "raspberry-pi"
  version: "4B"
  camera: true
  microphone: true

api:
  endpoint: "$API_ENDPOINT"
  timeout: 10
  retry_attempts: 3
  offline_storage: true

processing:
  whisper_model: "base"
  ocr_language: "eng+fil"
  confidence_threshold: 0.7
  max_processing_time: 30

audio:
  sample_rate: 16000
  channels: 1
  chunk_size: 1024
  format: "WAV"

vision:
  camera_resolution: [1920, 1080]
  preprocessing:
    grayscale: true
    adaptive_threshold: true
    noise_reduction: true
EOF

# Deploy to Raspberry Pi
echo "🚀 Deploying to Raspberry Pi..."

# Copy files to Pi
echo "Copying files..."
scp -r dist/edge/* $PI_USER@$PI_HOST:~/transaction-processor/

# Run installation
echo "Running installation..."
ssh $PI_USER@$PI_HOST "cd ~/transaction-processor && bash install.sh"

# Test deployment
echo "🧪 Testing deployment..."
ssh $PI_USER@$PI_HOST "cd ~/transaction-processor && python3 raspberry-pi-processor.py --test"

echo "✅ Deployment complete!"
echo ""
echo "To monitor the service:"
echo "ssh $PI_USER@$PI_HOST 'sudo journalctl -u transaction-processor -f'"
echo ""
echo "To check status:"
echo "ssh $PI_USER@$PI_HOST 'sudo systemctl status transaction-processor'"
echo ""
echo "Device will start processing transactions automatically."
echo "JSON output will be sent to: $API_ENDPOINT/api/transactions"