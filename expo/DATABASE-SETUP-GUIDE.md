# TBWA HRIS Database Setup Guide

## Overview

The TBWA HRIS platform uses a comprehensive multi-schema PostgreSQL database hosted on Supabase. This guide will help you set up the complete database structure.

## Database Architecture

### Schemas to be Created

1. **hr_admin** - Human Resources administration
2. **financial_ops** - Financial operations and expense management  
3. **operations** - Project and resource management
4. **corporate** - Policies and compliance
5. **face_ops** - FACE senior care operations
6. **creative_palette_ops** - Creative campaigns and Lions Palette
7. **qa_class** - Quality assurance and training
8. **unified_platform** - Cross-platform integration
9. **scout_dash** - Retail analytics and consumer insights

### Core Tables (50+ tables total)

#### HR Module
- profiles (shared user table)
- departments
- hr_employee_details
- hr_employment_info
- hr_attendance
- hr_leave_requests
- hr_performance_reviews

#### Financial Module
- finance_expenses
- finance_expense_receipts
- finance_cash_advances
- finance_reimbursements
- finance_approvals
- finance_budgets

#### Operations Module
- projects
- resources
- clients
- tasks
- milestones

#### Scout Dashboard
- stores (Philippine retail)
- products
- transactions
- campaigns
- handshake_events

## Setup Instructions

### Option 1: Supabase SQL Editor (Easiest)

1. **Open the SQL Editor**
   ```
   https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new
   ```

2. **Execute First Migration**
   - Open file: `backend/db/migrations/001_complete_hris_schema.sql`
   - Copy entire contents
   - Paste into SQL editor
   - Click "Run"

3. **Execute Second Migration**
   - Open file: `backend/db/migrations/002_unified_platform_schemas.sql`
   - Copy entire contents
   - Paste into SQL editor
   - Click "Run"

4. **Verify Setup**
   - Go to Table Editor
   - Check that all schemas and tables are created

### Option 2: Using PSQL Command Line

1. **Get Database Password**
   - Go to: https://app.supabase.com/project/cxzllzyxwpyptfretryc/settings/database
   - Copy the database password

2. **Update .env.local**
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.cxzllzyxwpyptfretryc.supabase.co:5432/postgres
   ```

3. **Run Migrations**
   ```bash
   # Install psql if needed
   brew install postgresql  # macOS
   
   # Execute migrations
   psql $DATABASE_URL -f backend/db/migrations/001_complete_hris_schema.sql
   psql $DATABASE_URL -f backend/db/migrations/002_unified_platform_schemas.sql
   ```

### Option 3: Using the Setup Script

```bash
# Run the automated setup script
./scripts/execute-sql-migrations.sh
```

## Verification

After setup, verify the database:

```sql
-- Check schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN (
  'hr_admin', 'financial_ops', 'operations', 'corporate',
  'face_ops', 'creative_palette_ops', 'qa_class', 
  'unified_platform', 'scout_dash'
);

-- Count tables
SELECT 
  table_schema,
  COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY table_schema
ORDER BY table_schema;
```

## Features Implemented

### Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Audit trails for sensitive operations
- Encrypted data at rest

### Automation
- Auto-generated reference numbers (EXP-202401-00001)
- Timestamp tracking
- Trigger-based validations
- Cascade operations

### Integration
- Cross-schema foreign keys
- Unified views for reporting
- Shared authentication
- Cross-functional workflows

## Post-Setup Steps

1. **Test the Connection**
   ```bash
   node scripts/test-supabase.js
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access Points**
   - API: http://localhost:4000
   - Web App: http://localhost:3000
   - Mobile: Expo Go app

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the service_role key
   - Check that RLS is properly configured

2. **Schema Not Found**
   - Run migrations in order (001 then 002)
   - Check for SQL syntax errors

3. **Connection Failed**
   - Verify credentials in .env.local
   - Check network connectivity
   - Ensure Supabase project is active

### Getting Help

- Supabase Dashboard: https://app.supabase.com/project/cxzllzyxwpyptfretryc
- Logs: Check Table Editor for migration results
- Support: Check Supabase documentation

## Migration Files

- `backend/db/migrations/001_complete_hris_schema.sql` - Core HRIS tables
- `backend/db/migrations/002_unified_platform_schemas.sql` - Platform schemas
- `scripts/quick-setup.sql` - Quick verification queries

## Success Indicators

When setup is complete, you should have:
- ✅ 9 schemas created
- ✅ 50+ tables across all schemas
- ✅ Foreign key relationships established
- ✅ RLS policies enabled
- ✅ Functions and triggers active
- ✅ Indexes for performance optimization