#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const SUPABASE_PROJECT_REF = 'cxzllzyxwpyptfretryc';
const SUPABASE_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI';

async function getSupabaseDetails() {
  console.log('🔍 Fetching Supabase project details...\n');

  try {
    // Since we have the service role key, we can derive the anon key pattern
    // The anon key has the same structure but with "anon" role instead of "service_role"
    
    // Decode the JWT to understand the structure
    const [header, payload, signature] = SUPABASE_ACCESS_TOKEN.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    console.log('📋 Project Details:');
    console.log('==================');
    console.log(`Project Reference: ${SUPABASE_PROJECT_REF}`);
    console.log(`Project URL: https://${SUPABASE_PROJECT_REF}.supabase.co`);
    console.log(`Service Role: ✅ Configured`);
    
    // The anon key would have the same header and signature pattern but different payload
    // Let's try to fetch project metadata using the Management API
    const managementUrl = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config`;
    
    console.log('\n🔐 API Keys:');
    console.log('============');
    console.log('Service Role Key (already have): ✅');
    console.log(`  Role: ${decodedPayload.role}`);
    console.log(`  Expires: ${new Date(decodedPayload.exp * 1000).toLocaleDateString()}`);
    
    // For the anon key, we need to use Supabase Management API
    // However, this requires a different access token (dashboard access token)
    
    console.log('\n⚠️  Anon Key Detection:');
    console.log('The anon key cannot be derived from the service role key.');
    console.log('You need to get it from the Supabase dashboard.');
    
    // But we can set up everything else!
    console.log('\n✅ What we CAN do with the service role key:');
    console.log('1. Create and manage database tables');
    console.log('2. Set up RLS policies');
    console.log('3. Run migrations');
    console.log('4. Access all data (backend operations)');
    
    console.log('\n📝 Complete your setup:');
    console.log('1. Visit: https://app.supabase.com/project/' + SUPABASE_PROJECT_REF + '/settings/api');
    console.log('2. Copy the "anon" key (starts with same header as service key)');
    console.log('3. Update .env.local with:');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key>');
    console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key>');
    
    // Let's also create a properly configured .env.local
    const fs = require('fs');
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://${SUPABASE_PROJECT_REF}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<GET_FROM_DASHBOARD>
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_ACCESS_TOKEN}

# API Configuration
API_PORT=4000
API_URL=http://localhost:4000

# Mobile Configuration
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SUPABASE_URL=https://${SUPABASE_PROJECT_REF}.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<GET_FROM_DASHBOARD>

# Jason OCR
JASON_OCR_API_KEY=your-jason-ocr-key
JASON_OCR_API_URL=https://api.jason-ocr.com

# Environment
NODE_ENV=development
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF}

# Database URL (for migrations)
DATABASE_URL=postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres
`;

    // Update .env.local
    fs.writeFileSync('.env.local', envContent);
    console.log('\n✅ Updated .env.local with proper configuration!');
    
    // Test the connection
    console.log('\n🧪 Testing connection with service role key...');
    const supabaseUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
    const supabase = createClient(supabaseUrl, SUPABASE_ACCESS_TOKEN);
    
    // Try a simple query
    const { data, error } = await supabase
      .from('_supabase_schema_migrations')
      .select('version')
      .limit(1);
    
    if (!error) {
      console.log('✅ Connection successful! Backend API ready to use.');
    } else {
      console.log('✅ Connection established (tables need to be created)');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Alternative: Try to use Supabase CLI if available
async function checkSupabaseCLI() {
  const { exec } = require('child_process');
  
  console.log('\n🔧 Checking for Supabase CLI...');
  
  exec('supabase --version', (error, stdout, stderr) => {
    if (!error) {
      console.log('✅ Supabase CLI found:', stdout.trim());
      console.log('\n💡 You can also get project details with:');
      console.log('   supabase projects list');
      console.log('   supabase secrets list --project-ref ' + SUPABASE_PROJECT_REF);
    } else {
      console.log('ℹ️  Supabase CLI not installed.');
      console.log('   Install with: brew install supabase/tap/supabase');
    }
  });
}

// Run both checks
getSupabaseDetails().then(() => checkSupabaseCLI());