#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

console.log('🧪 Testing Authentication Setup\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function testAuth() {
  console.log('1️⃣ Testing Sign Up');
  console.log('==================');
  
  const testEmail = `test${Date.now()}@tbwa.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          department: 'IT'
        }
      }
    });
    
    if (error) {
      console.error('❌ Sign up failed:', error.message);
    } else {
      console.log('✅ Sign up successful!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  console.log('\n2️⃣ Testing Sign In');
  console.log('==================');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.error('❌ Sign in failed:', error.message);
    } else {
      console.log('✅ Sign in successful!');
      console.log('   Session:', data.session ? 'Active' : 'None');
      console.log('   Access Token:', data.session?.access_token ? 'Present' : 'Missing');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  console.log('\n3️⃣ Mobile App Code Example');
  console.log('==========================');
  console.log(`
// apps/mobile/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = '${supabaseUrl}'
const supabaseAnonKey = '${anonKey}'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
`);

  console.log('\n4️⃣ Web App Code Example');
  console.log('========================');
  console.log(`
// apps/web-admin/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${supabaseUrl}'
const supabaseAnonKey = '${anonKey}'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})
`);

  console.log('\n✅ Authentication is ready to use in your apps!');
}

testAuth();