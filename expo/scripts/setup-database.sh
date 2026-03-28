#!/bin/bash

# Database setup script for HRIS-FS-AI Central Hub

echo "🚀 HRIS Database Setup"
echo "====================="
echo ""
echo "This script will help you set up your database schema."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found. Please create it first."
    exit 1
fi

# Load environment variables
source .env.local

echo -e "${YELLOW}Your Supabase Project:${NC}"
echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "Project Ref: $SUPABASE_PROJECT_REF"
echo ""

echo -e "${BLUE}Option 1: Automatic Setup (Recommended)${NC}"
echo "1. The migration file has been created at:"
echo "   backend/db/migrations/001_complete_hris_schema.sql"
echo ""
echo "2. To apply it automatically:"
echo "   - Install Supabase CLI: brew install supabase/tap/supabase"
echo "   - Run: supabase db push --db-url 'postgresql://postgres:YOUR_DB_PASSWORD@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres'"
echo ""

echo -e "${BLUE}Option 2: Manual Setup via Supabase Dashboard${NC}"
echo "1. Open: https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/sql/new"
echo "2. Copy the contents of: backend/db/migrations/001_complete_hris_schema.sql"
echo "3. Paste into the SQL editor"
echo "4. Click 'Run' to execute"
echo ""

echo -e "${BLUE}Option 3: Using Migration Script${NC}"
echo "Run: node scripts/run-migrations.js"
echo ""

echo -e "${GREEN}Database Schema Features:${NC}"
echo "✅ Modular design with HR and Finance separation"
echo "✅ Integration tables for cross-functional workflows"
echo "✅ Row Level Security (RLS) policies"
echo "✅ Audit logging on sensitive operations"
echo "✅ Automatic number generation (expenses, tickets)"
echo "✅ Views for integrated reporting"
echo ""

echo -e "${GREEN}Schema Modules:${NC}"
echo ""
echo "👥 HR Module:"
echo "   - Employee management"
echo "   - Attendance tracking"
echo "   - Leave management"
echo "   - Document (201 files) management"
echo ""
echo "💰 Finance Module:"
echo "   - Expense management"
echo "   - Cash advances"
echo "   - Reimbursements"
echo "   - Policy enforcement"
echo ""
echo "🔗 Integration Points:"
echo "   - Compensation (HR ↔ Finance)"
echo "   - Payroll runs"
echo "   - Cross-functional ticketing"
echo "   - Unified audit trail"
echo ""

# Create a simplified schema diagram
echo -e "${YELLOW}Schema Overview:${NC}"
cat << 'EOF'

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │   SHARED    │     │  HR MODULE  │     │   FINANCE   │
    ├─────────────┤     ├─────────────┤     ├─────────────┤
    │ profiles    │────▶│ attendance  │     │ expenses    │
    │ departments │     │ leaves      │     │ advances    │
    │ tickets     │     │ documents   │     │ reimburse   │
    └─────────────┘     └─────────────┘     └─────────────┘
           │                    │                    │
           └────────────────────┴────────────────────┘
                                │
                      ┌─────────────────┐
                      │  INTEGRATION    │
                      ├─────────────────┤
                      │ compensation    │
                      │ payroll_runs    │
                      │ audit_logs      │
                      └─────────────────┘

EOF

echo ""
echo "Ready to proceed? Check the migration file and run one of the setup options above."
echo ""
echo "Need help? Check the Supabase docs: https://supabase.com/docs/guides/database"