#!/bin/bash

# Development startup script
echo "🚀 Starting HRIS-FS-AI Central Hub Development Servers..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.example .env.local 2>/dev/null || cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
API_PORT=4000
API_URL=http://localhost:4000

# Mobile
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Environment
NODE_ENV=development
EOF
    echo "📝 Please update .env.local with your actual credentials"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "⚠️  Port $1 is already in use. Please free it or change the port."
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking ports..."
PORTS=(3000 3001 3002 4000 8081)
for port in "${PORTS[@]}"; do
    check_port $port || exit 1
done

echo "✅ All ports available"

# Start services based on argument
case "$1" in
    "mobile")
        echo "📱 Starting mobile app..."
        cd apps/mobile && npm run dev
        ;;
    "web-admin")
        echo "🖥️  Starting web admin..."
        cd apps/web-admin && npm run dev
        ;;
    "web-manager")
        echo "👔 Starting web manager..."
        cd apps/web-manager && npm run dev
        ;;
    "api")
        echo "🔌 Starting API server..."
        cd backend/api && npm run dev
        ;;
    "ai-dashboard")
        echo "📊 Starting AI dashboard..."
        cd apps/ai-dashboard && npm run dev
        ;;
    *)
        echo "🎯 Starting all services..."
        echo ""
        echo "Services will be available at:"
        echo "  📱 Mobile:      Expo Go or http://localhost:8081"
        echo "  🖥️  Web Admin:   http://localhost:3001"
        echo "  👔 Manager:     http://localhost:3002"
        echo "  📊 Dashboard:   http://localhost:3000"
        echo "  🔌 API:         http://localhost:4000"
        echo ""
        echo "Press Ctrl+C to stop all services"
        echo ""
        
        # Use turbo if available, otherwise use npm workspaces
        if command -v turbo &> /dev/null; then
            npm run dev
        else
            echo "Starting services individually (install turbo for better performance)..."
            # Start each service in background
            (cd backend/api && npm run dev) &
            (cd apps/ai-dashboard && npm run dev) &
            (cd apps/web-admin && npm run dev) &
            (cd apps/web-manager && npm run dev) &
            (cd apps/mobile && npm run dev) &
            
            # Wait for all background processes
            wait
        fi
        ;;
esac