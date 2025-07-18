#!/usr/bin/env node

// MCP-based table creation script
// This demonstrates how to create tables using MCP when properly configured

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createEmployeesTable() {
  console.log('🚀 Creating employees table with MCP approach...\n');

  // SQL to create the hr_admin schema and employees table
  const sql = `
    -- Create schema if not exists
    CREATE SCHEMA IF NOT EXISTS hr_admin;

    -- Create employees table
    CREATE TABLE IF NOT EXISTS hr_admin.employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      department_id UUID,
      position_id UUID,
      hire_date DATE NOT NULL,
      status TEXT CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
      face_encoding JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON hr_admin.employees(employee_id);
    CREATE INDEX IF NOT EXISTS idx_employees_email ON hr_admin.employees(email);
    CREATE INDEX IF NOT EXISTS idx_employees_department ON hr_admin.employees(department_id);
    CREATE INDEX IF NOT EXISTS idx_employees_status ON hr_admin.employees(status);

    -- Create update trigger
    CREATE OR REPLACE FUNCTION hr_admin.update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_employees_updated_at ON hr_admin.employees;
    CREATE TRIGGER update_employees_updated_at
      BEFORE UPDATE ON hr_admin.employees
      FOR EACH ROW
      EXECUTE FUNCTION hr_admin.update_updated_at();
  `;

  try {
    // Execute SQL directly (simulating MCP's run_sql function)
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      // If exec_sql doesn't exist, show the SQL for manual execution
      console.log('⚠️  Direct execution not available. Please run this SQL in Supabase dashboard:\n');
      console.log('📋 SQL to execute:');
      console.log('================');
      console.log(sql);
      console.log('\n🔗 Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new');
    } else {
      console.log('✅ Employees table created successfully!');
    }

    // Verify table structure
    console.log('\n📊 Verifying table structure...');
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'hr_admin')
      .eq('table_name', 'employees');

    if (columns && columns.length > 0) {
      console.log('\n✅ Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n💡 With MCP properly configured, this would execute directly without copy-paste!');
  console.log('   See MCP-QUICK-SETUP.md for configuration instructions.');
}

// Example of how MCP would work when configured
console.log('📌 MCP Direct Execution Example:');
console.log('================================');
console.log(`
// When MCP is configured, Claude can run:
await mcp.run_sql({
  projectRef: "cxzllzyxwpyptfretryc",
  query: \`CREATE TABLE hr_admin.employees (...)\`
});

// Or use the create_table helper:
await mcp.create_table({
  projectRef: "cxzllzyxwpyptfretryc",
  schema: "hr_admin",
  tableName: "employees",
  columns: [
    { name: "id", type: "uuid", primaryKey: true },
    { name: "email", type: "text", unique: true },
    // ... more columns
  ]
});
`);

console.log('\n🚀 Running table creation...\n');
createEmployeesTable();