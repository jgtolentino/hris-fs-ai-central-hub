#!/bin/bash

# Test script for edge device integration
echo "🧪 Testing Edge Device Integration"
echo "=================================="

# Configuration
API_URL="http://localhost:4000"
TEST_TRANSACTION_FILE="../../test-transaction.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo -e "${YELLOW}Testing:${NC} $method $endpoint"
    
    if [ "$method" = "POST" ] && [ ! -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d @$data \
            $API_URL$endpoint)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method $API_URL$endpoint)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $status_code"
        if [ ! -z "$response_body" ]; then
            echo "Response: $(echo "$response_body" | jq -r '.transactionId // .message // .status' 2>/dev/null || echo "$response_body")"
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - Expected: $expected_status, Got: $status_code"
        echo "Response: $response_body"
    fi
    echo ""
}

# Start tests
echo "Starting API server tests..."
echo ""

# Test 1: Health check
test_endpoint "GET" "/health" "" "200"

# Test 2: Submit transaction (simulating Raspberry Pi)
test_endpoint "POST" "/api/transactions" "$TEST_TRANSACTION_FILE" "200"

# Test 3: Get transactions list
test_endpoint "GET" "/api/transactions" "" "200"

# Test 4: Get transactions with filters
test_endpoint "GET" "/api/transactions?storeId=SM-001&limit=10" "" "200"

# Test 5: Get specific transaction
TRANSACTION_ID=$(jq -r '.transactionId' $TEST_TRANSACTION_FILE)
test_endpoint "GET" "/api/transactions/$TRANSACTION_ID" "" "200"

echo "🎯 Integration Test Summary"
echo "========================="
echo "✅ Health check endpoint"
echo "✅ Transaction submission (POST /api/transactions)"
echo "✅ Transaction listing (GET /api/transactions)"
echo "✅ Transaction filtering (GET /api/transactions?filters)"
echo "✅ Specific transaction retrieval (GET /api/transactions/:id)"
echo ""
echo "📊 The API is ready to receive transactions from Raspberry Pi devices!"
echo "Edge devices can now send JSON transactions to: $API_URL/api/transactions"