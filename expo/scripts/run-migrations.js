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

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  const migrationsDir = path.join(__dirname, '../backend/db/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`📄 Running migration: ${file}`);
    
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split by semicolons but preserve those within strings
      const statements = sql
        .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          // Skip comments
          if (statement.startsWith('--') || statement.length === 0) continue;
          
          // Execute statement
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          }).single();

          if (error) {
            // Try direct execution for DDL statements
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({ sql_query: statement + ';' })
            });

            if (!response.ok) {
              console.error(`  ❌ Failed: ${statement.substring(0, 50)}...`);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`  ❌ Error in statement: ${err.message}`);
          errorCount++;
        }
      }

      console.log(`  ✅ Completed: ${successCount} successful, ${errorCount} errors\n`);
      
    } catch (err) {
      console.error(`  ❌ Failed to read migration file: ${err.message}\n`);
    }
  }

  console.log('\n🏁 Migration Summary:');
  console.log('====================');
  
  // Check what tables were created
  try {
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tables && tables.length > 0) {
      console.log(`\n📊 Tables in database (${tables.length} total):`);
      
      const hrTables = tables.filter(t => t.table_name.startsWith('hr_'));
      const financeTables = tables.filter(t => t.table_name.startsWith('finance_'));
      const integrationTables = tables.filter(t => t.table_name.startsWith('integration_'));
      const otherTables = tables.filter(t => 
        !t.table_name.startsWith('hr_') && 
        !t.table_name.startsWith('finance_') && 
        !t.table_name.startsWith('integration_')
      );

      console.log(`\n👥 HR Module (${hrTables.length} tables):`);
      hrTables.forEach(t => console.log(`   - ${t.table_name}`));
      
      console.log(`\n💰 Finance Module (${financeTables.length} tables):`);
      financeTables.forEach(t => console.log(`   - ${t.table_name}`));
      
      console.log(`\n🔗 Integration Tables (${integrationTables.length} tables):`);
      integrationTables.forEach(t => console.log(`   - ${t.table_name}`));
      
      console.log(`\n📋 Core/Other Tables (${otherTables.length} tables):`);
      otherTables.forEach(t => console.log(`   - ${t.table_name}`));
    }
  } catch (err) {
    console.error('Could not fetch table list:', err.message);
  }

  console.log('\n✨ Migrations complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Update .env.local with the anon key from Supabase dashboard');
  console.log('2. Run: npm run dev');
  console.log('3. Test the API at: http://localhost:4000/health');
}

// Alternative approach if exec_sql doesn't exist
async function createExecSqlFunction() {
  const createFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: createFunction
    });

    if (response.ok) {
      console.log('✅ Created exec_sql function');
    }
  } catch (err) {
    // Function might already exist
  }
}

// Run the migrations
createExecSqlFunction().then(() => runMigrations());