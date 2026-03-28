#!/usr/bin/env node

const https = require('https');

// Based on CLAUDE.md, the proper way to get Supabase keys is through the Management API
// However, this requires a personal access token from the Supabase dashboard

console.log('📋 Supabase Key Retrieval Guide');
console.log('================================\n');

console.log('Your Supabase Configuration:');
console.log('- Project Reference: cxzllzyxwpyptfretryc');
console.log('- Project URL: https://cxzllzyxwpyptfretryc.supabase.co');
console.log('- Service Role Key: ✅ Already configured\n');

console.log('To get your Anon Key, you have 3 options:\n');

console.log('Option 1: Supabase Dashboard (Easiest - 2 minutes)');
console.log('------------------------------------------------');
console.log('1. Open your browser and go to:');
console.log('   https://app.supabase.com/project/cxzllzyxwpyptfretryc/settings/api\n');
console.log('2. Look for the section "Project API keys"');
console.log('3. Find the row labeled "anon public"');
console.log('4. Click the "Reveal" button');
console.log('5. Copy the entire key (starts with eyJhbGc...)\n');

console.log('Option 2: Using Supabase CLI (If you have dashboard access)');
console.log('----------------------------------------------------------');
console.log('1. First, login to Supabase CLI:');
console.log('   supabase login\n');
console.log('2. Link to your project:');
console.log('   supabase link --project-ref cxzllzyxwpyptfretryc\n');
console.log('3. Get project details:');
console.log('   supabase projects api-keys --project-ref cxzllzyxwpyptfretryc\n');

console.log('Option 3: Generate Personal Access Token (Advanced)');
console.log('--------------------------------------------------');
console.log('1. Go to: https://app.supabase.com/account/tokens');
console.log('2. Create a new personal access token');
console.log('3. Use it with the Management API:\n');

// Show example of what the anon key looks like
console.log('What to Look For:');
console.log('================');
console.log('The anon key will have this structure:');
console.log('- Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
console.log('- Contains: {"iss":"supabase","ref":"cxzllzyxwpyptfretryc","role":"anon",...}');
console.log('- Same project ref as your service key');
console.log('- Role is "anon" instead of "service_role"\n');

console.log('Once You Have the Anon Key:');
console.log('===========================');
console.log('Update your .env.local file:');
console.log('');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-your-anon-key-here>');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste-your-anon-key-here>\n');

// Create a helper function to validate the key format
function validateSupabaseKey(key) {
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return {
      valid: true,
      role: payload.role,
      ref: payload.ref,
      iat: new Date(payload.iat * 1000).toISOString(),
      exp: new Date(payload.exp * 1000).toISOString()
    };
  } catch (e) {
    return { valid: false };
  }
}

// Quick validation helper
console.log('Key Validation Helper:');
console.log('====================');
console.log('You can validate your key by running:');
console.log('node -e "console.log(JSON.parse(Buffer.from(\'YOUR_KEY\'.split(\'.\')[1], \'base64\').toString()))"');
console.log('\nThis will show the JWT payload and confirm the role is "anon".\n');

// Additional tips
console.log('💡 Pro Tips:');
console.log('============');
console.log('- The anon key is safe to use in client-side code');
console.log('- It has limited permissions based on your RLS policies');
console.log('- Never expose the service_role key in client apps');
console.log('- Both keys expire in 2035 based on your configuration\n');

console.log('🔗 Direct Link to API Keys:');
console.log('https://app.supabase.com/project/cxzllzyxwpyptfretryc/settings/api');
console.log('\n✨ That\'s it! Just copy the anon key from the dashboard and you\'re all set.');