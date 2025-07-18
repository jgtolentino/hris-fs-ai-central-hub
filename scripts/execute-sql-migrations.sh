#!/bin/bash

# TBWA HRIS Database Setup Script
# This script helps execute the SQL migrations for the complete database schema

echo "🚀 TBWA HRIS Database Schema Setup"
echo "=================================="
echo ""

# Check if DATABASE_URL has a password
if grep -q "YOUR-DATABASE-PASSWORD" .env.local; then
    echo "⚠️  DATABASE_URL in .env.local needs the database password"
    echo ""
    echo "Please get your database password from:"
    echo "https://app.supabase.com/project/cxzllzyxwpyptfretryc/settings/database"
    echo ""
    echo "Then update DATABASE_URL in .env.local"
    echo ""
    exit 1
fi

# Function to execute SQL file
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo "📄 Executing: $description"
    echo "   File: $sql_file"
    
    if [ -f "$sql_file" ]; then
        # Try using psql if available
        if command -v psql &> /dev/null; then
            echo "   Using psql..."
            source .env.local
            psql "$DATABASE_URL" -f "$sql_file"
            if [ $? -eq 0 ]; then
                echo "   ✅ Success!"
            else
                echo "   ❌ Failed - see error above"
                return 1
            fi
        else
            echo "   ⚠️  psql not found. Please install PostgreSQL client tools."
            echo "   On macOS: brew install postgresql"
            echo "   On Ubuntu: sudo apt-get install postgresql-client"
            return 1
        fi
    else
        echo "   ❌ File not found: $sql_file"
        return 1
    fi
    echo ""
}

# Main execution
echo "📊 This will create:"
echo "   - 9 schemas (hr_admin, financial_ops, operations, etc.)"
echo "   - 50+ tables across all schemas"
echo "   - Foreign key relationships"
echo "   - Indexes for performance"
echo "   - Row Level Security policies"
echo "   - Functions and triggers"
echo ""

read -p "Continue with database setup? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔧 Starting migration execution..."
    echo ""
    
    # Execute migrations in order
    execute_sql "backend/db/migrations/001_complete_hris_schema.sql" "Core HRIS Schema"
    if [ $? -ne 0 ]; then
        echo "⚠️  First migration failed. Fix errors before continuing."
        exit 1
    fi
    
    execute_sql "backend/db/migrations/002_unified_platform_schemas.sql" "Unified Platform Schemas"
    if [ $? -ne 0 ]; then
        echo "⚠️  Second migration failed. Database may be partially set up."
        exit 1
    fi
    
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Verify tables in Supabase dashboard"
    echo "2. Run: npm run dev"
    echo "3. Test API: http://localhost:4000/health"
    echo ""
else
    echo ""
    echo "❌ Setup cancelled"
    echo ""
    echo "📝 Alternative: Use Supabase Dashboard"
    echo "1. Go to: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new"
    echo "2. Copy contents of backend/db/migrations/001_complete_hris_schema.sql"
    echo "3. Paste and run"
    echo "4. Repeat for backend/db/migrations/002_unified_platform_schemas.sql"
    echo ""
fi