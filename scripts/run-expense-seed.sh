#!/bin/bash
# Run Expense Seed Data Script
# Seeds database with comprehensive test data for ALL expense scenarios

set -e

echo "🌱 Starting expense data seed..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check for Supabase connection
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL not set"
  echo "Set it in .env file or export it:"
  echo "export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres'"
  exit 1
fi

echo "📊 Database: ${SUPABASE_DB_URL%%@*}@..."

# Run seed script
echo "🔄 Executing seed script..."
psql "$SUPABASE_DB_URL" -f scripts/seed-expense-data.sql

echo ""
echo "✅ Seed completed successfully!"
echo ""
echo "📋 Created:"
echo "  - 4 test users (2 employees, 1 manager, 1 admin)"
echo "  - 7 expense categories"
echo "  - 11 expenses in ALL states:"
echo "    ✏️  2 DRAFT (can edit/submit)"
echo "    📤 3 SUBMITTED (pending approval)"
echo "    ✅ 2 APPROVED (pending reimbursement)"
echo "    ❌ 1 REJECTED (can resubmit)"
echo "    💰 2 REIMBURSED (completed)"
echo "  - 3 policy violations"
echo "  - 3 OCR records"
echo "  - 3 approval logs"
echo ""
echo "🔐 Test Credentials:"
echo "  Employee: employee1@company.com / password123"
echo "  Manager:  manager1@company.com / password123"
echo ""
echo "🧪 All routes and scenarios are now testable!"
echo "   NO empty states, NO dead ends"
