#!/usr/bin/env node

const SUPABASE_PROJECT_REF = 'cxzllzyxwpyptfretryc';
const SUPABASE_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI';

async function getProjectKeys() {
  console.log('🔍 Attempting to retrieve project keys...\n');

  // The service_role key typically follows this pattern
  // We can try to construct the anon key based on common Supabase patterns
  
  // Decode the service role JWT
  const [header, payload, signature] = SUPABASE_ACCESS_TOKEN.split('.');
  const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString());
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
  
  console.log('Service Role Token Info:');
  console.log('- Algorithm:', decodedHeader.alg);
  console.log('- Role:', decodedPayload.role);
  console.log('- Project Ref:', decodedPayload.ref);
  console.log('- Issued:', new Date(decodedPayload.iat * 1000).toISOString());
  
  // The anon key would have the same structure but with role: "anon"
  // Let's create the anon payload
  const anonPayload = {
    ...decodedPayload,
    role: 'anon'
  };
  
  // Encode the anon payload
  const anonPayloadBase64 = Buffer.from(JSON.stringify(anonPayload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // The anon key would be: header.anonPayload.signature
  // However, the signature would be different as it's signed with the JWT secret
  
  console.log('\n⚠️  Important Note:');
  console.log('The anon key cannot be derived because it requires the JWT secret to sign.');
  console.log('The signature part would be different for the anon role.');
  
  // Let's try the Supabase Management API
  console.log('\n🌐 Trying Supabase Management API...');
  
  try {
    // First, let's see if we can use the service role key to get project info
    const response = await fetch(`https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ACCESS_TOKEN,
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`
      }
    });
    
    if (response.ok) {
      console.log('✅ API connection successful!');
      
      // Try to get auth config
      const authResponse = await fetch(`https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/settings`, {
        headers: {
          'apikey': SUPABASE_ACCESS_TOKEN,
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`
        }
      });
      
      if (authResponse.ok) {
        const settings = await authResponse.json();
        console.log('\nAuth Settings:', JSON.stringify(settings, null, 2));
      }
    }
  } catch (error) {
    console.error('API Error:', error.message);
  }
  
  console.log('\n📝 Manual Steps Required:');
  console.log('Since we cannot derive the anon key programmatically, please:');
  console.log('1. Go to: https://app.supabase.com/project/' + SUPABASE_PROJECT_REF + '/settings/api');
  console.log('2. Look for the "anon" key (it will start with the same header as your service key)');
  console.log('3. It should look like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.[different-signature]');
  console.log('\n💡 The anon key will have:');
  console.log('   - Same header (algorithm and type)');
  console.log('   - Same project ref');
  console.log('   - role: "anon" instead of "service_role"');
  console.log('   - Different signature (last part after the second dot)');
}

getProjectKeys();