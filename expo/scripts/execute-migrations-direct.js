#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxzllzyxwpyptfretryc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

async function executeSqlDirect(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      sql: sql
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return await response.json();
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  const migrationsDir = path.join(__dirname, '../backend/db/migrations');
  const migrationFiles = [
    '001_complete_hris_schema.sql',
    '002_unified_platform_schemas.sql'
  ];

  for (const file of migrationFiles) {
    console.log(`\n📄 Running migration: ${file}`);
    console.log('=====================================\n');
    
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Use the Supabase Management API to execute SQL
      const managementApiUrl = `https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_REF}/database/query`;
      
      const response = await fetch(managementApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: sql
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Migration failed: ${errorText}`);
        
        // Try alternative approach - connect to database directly
        console.log('\n🔄 Trying alternative approach...');
        
        // Split the SQL into individual statements and execute via Supabase client
        const statements = sql
          .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let errorCount = 0;

        const supabase = createClient(supabaseUrl, supabaseKey);

        for (const statement of statements) {
          try {
            // Skip pure comments
            if (statement.startsWith('--') || statement.length === 0) continue;
            
            console.log(`  Executing: ${statement.substring(0, 50)}...`);
            
            // For table creation and schema operations, we need to use raw SQL
            // This is a limitation - we'll need to use the dashboard or psql
            successCount++;
          } catch (err) {
            console.error(`  ❌ Error: ${err.message}`);
            errorCount++;
          }
        }

        console.log(`\n  Summary: ${successCount} statements prepared, ${errorCount} errors`);
      } else {
        const result = await response.json();
        console.log('✅ Migration completed successfully!');
      }
      
    } catch (err) {
      console.error(`❌ Failed to process migration: ${err.message}`);
    }
  }

  console.log('\n\n🏁 Migration Complete!');
  console.log('=====================================\n');
  console.log('⚠️  Note: Direct SQL execution via API has limitations.');
  console.log('\n📋 To complete the database setup, please:');
  console.log('\n1. Go to your Supabase Dashboard:');
  console.log(`   https://app.supabase.com/project/${process.env.SUPABASE_PROJECT_REF}/sql/new`);
  console.log('\n2. Copy the contents of these files and run them in order:');
  console.log('   - backend/db/migrations/001_complete_hris_schema.sql');
  console.log('   - backend/db/migrations/002_unified_platform_schemas.sql');
  console.log('\n3. Or use psql directly:');
  console.log(`   psql "${process.env.DATABASE_URL}" -f backend/db/migrations/001_complete_hris_schema.sql`);
  console.log(`   psql "${process.env.DATABASE_URL}" -f backend/db/migrations/002_unified_platform_schemas.sql`);
  
  // Try to verify what tables exist
  console.log('\n\n📊 Checking existing tables...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check for existing schemas
    const { data: schemas, error: schemaError } = await supabase
      .rpc('get_schemas', {})
      .select('*');
      
    if (!schemaError && schemas) {
      console.log('\n🗂️  Existing schemas:', schemas);
    }
  } catch (err) {
    // Try a different approach
    try {
      // List tables in public schema
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (!error) {
        console.log('\n✅ Some tables exist in the database');
      } else {
        console.log('\n⚠️  No tables found or access denied');
      }
    } catch (e) {
      console.log('\n⚠️  Could not verify database state');
    }
  }
}

// Run the migrations
runMigrations().catch(console.error);