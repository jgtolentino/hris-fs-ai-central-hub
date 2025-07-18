#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cxzllzyxwpyptfretryc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    // Test 1: Check tables
    console.log('📊 Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('⚠️  Could not list tables (this is normal for new projects)');
    } else {
      console.log('✅ Connection successful!');
      console.log(`📋 Found ${tables?.length || 0} tables in public schema`);
    }
    
    // Test 2: Try to select from expenses table
    console.log('\n📝 Checking for expenses table...');
    const { data, error } = await supabase
      .from('expenses')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Expenses table not found (needs to be created)');
        console.log('\n💡 Next step: Run the database migration from hris-expense-schema.sql');
      } else {
        console.log('⚠️  Error:', error.message);
      }
    } else {
      console.log('✅ Expenses table exists!');
    }
    
    console.log('\n🎉 Supabase connection is working!');
    console.log('📌 Your service role key has full database access.');
    console.log('⚠️  Remember to get the anon key for client-side apps.');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();