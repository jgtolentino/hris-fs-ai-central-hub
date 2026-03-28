#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const projectRef = process.env.SUPABASE_PROJECT_REF || 'cxzllzyxwpyptfretryc';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

async function setupDatabase() {
  console.log('🚀 Setting up TBWA HRIS Database Schema\n');
  
  // Read the SQL files
  const migrationsDir = path.join(__dirname, '../backend/db/migrations');
  const sql1 = fs.readFileSync(path.join(migrationsDir, '001_complete_hris_schema.sql'), 'utf8');
  const sql2 = fs.readFileSync(path.join(migrationsDir, '002_unified_platform_schemas.sql'), 'utf8');
  
  console.log('📋 Database Setup Instructions');
  console.log('================================\n');
  
  console.log('Since direct SQL execution through the API requires special permissions,');
  console.log('please follow these steps to set up your database:\n');
  
  console.log('Option 1: Supabase Dashboard (Recommended)');
  console.log('------------------------------------------');
  console.log(`1. Open: https://app.supabase.com/project/${projectRef}/sql/new`);
  console.log('2. Copy and paste the contents of:');
  console.log('   - backend/db/migrations/001_complete_hris_schema.sql');
  console.log('3. Click "Run" to execute');
  console.log('4. Repeat for:');
  console.log('   - backend/db/migrations/002_unified_platform_schemas.sql\n');
  
  console.log('Option 2: Using PSQL (If you have the database password)');
  console.log('--------------------------------------------------------');
  console.log('1. Get your database password from:');
  console.log(`   https://app.supabase.com/project/${projectRef}/settings/database`);
  console.log('2. Update DATABASE_URL in .env.local with the password');
  console.log('3. Run these commands:');
  console.log('   psql $DATABASE_URL -f backend/db/migrations/001_complete_hris_schema.sql');
  console.log('   psql $DATABASE_URL -f backend/db/migrations/002_unified_platform_schemas.sql\n');
  
  console.log('Option 3: Using Supabase CLI (Local Development)');
  console.log('------------------------------------------------');
  console.log('1. supabase link --project-ref ' + projectRef);
  console.log('2. supabase db push\n');
  
  console.log('\n📊 What will be created:');
  console.log('========================\n');
  
  console.log('Schemas:');
  console.log('--------');
  console.log('✓ hr_admin - Human Resources administration');
  console.log('✓ financial_ops - Financial operations and expense management');
  console.log('✓ operations - Project and resource management');
  console.log('✓ corporate - Policies and compliance');
  console.log('✓ face_ops - FACE senior care operations');
  console.log('✓ creative_palette_ops - Creative campaigns and Lions Palette');
  console.log('✓ qa_class - Quality assurance and training');
  console.log('✓ unified_platform - Cross-platform integration');
  console.log('✓ scout_dash - Retail analytics and consumer insights\n');
  
  console.log('Core Features:');
  console.log('--------------');
  console.log('✓ Employee management with complete HR lifecycle');
  console.log('✓ Expense tracking with multi-level approvals');
  console.log('✓ Attendance and leave management');
  console.log('✓ Project and resource allocation');
  console.log('✓ Philippine retail store analytics');
  console.log('✓ Creative campaign effectiveness tracking');
  console.log('✓ Senior care operations management');
  console.log('✓ Training and certification tracking');
  console.log('✓ Cross-functional ticketing system');
  console.log('✓ Comprehensive audit trails\n');
  
  console.log('Security Features:');
  console.log('------------------');
  console.log('✓ Row Level Security (RLS) on all tables');
  console.log('✓ Role-based access control');
  console.log('✓ Audit logging for sensitive operations');
  console.log('✓ Data encryption at rest\n');
  
  // Save a quick reference SQL file
  const quickSetupSQL = `-- TBWA HRIS Quick Setup
-- Run this in Supabase SQL Editor

-- First, run the contents of:
-- backend/db/migrations/001_complete_hris_schema.sql

-- Then, run the contents of:
-- backend/db/migrations/002_unified_platform_schemas.sql

-- Verify setup:
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN (
  'hr_admin', 'financial_ops', 'operations', 'corporate',
  'face_ops', 'creative_palette_ops', 'qa_class', 
  'unified_platform', 'scout_dash'
);

-- Check table count:
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
`;

  fs.writeFileSync(path.join(__dirname, 'quick-setup.sql'), quickSetupSQL);
  console.log('💾 Created: scripts/quick-setup.sql for reference\n');
  
  console.log('🎯 Next Steps:');
  console.log('==============');
  console.log('1. Execute the migrations using one of the options above');
  console.log('2. Verify the setup by checking the Table Editor in Supabase');
  console.log('3. Run: npm run dev to start the development server');
  console.log('4. Test the API at: http://localhost:4000/health\n');
}

setupDatabase().catch(console.error);