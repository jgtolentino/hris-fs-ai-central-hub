#!/usr/bin/env node

// Script to decode and display Supabase JWT information
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI';

console.log('🔐 Supabase Configuration Info:\n');
console.log('Project Reference: cxzllzyxwpyptfretryc');
console.log('Project URL: https://cxzllzyxwpyptfretryc.supabase.co\n');

// Decode JWT payload (middle part)
const [header, payload, signature] = serviceRoleKey.split('.');
const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());

console.log('Service Role Key Details:');
console.log('- Role:', decodedPayload.role);
console.log('- Issued At:', new Date(decodedPayload.iat * 1000).toISOString());
console.log('- Expires:', new Date(decodedPayload.exp * 1000).toISOString());

console.log('\n⚠️  Important: You still need the ANON key!');
console.log('To get your anon key:');
console.log('1. Go to https://app.supabase.com/project/cxzllzyxwpyptfretryc/settings/api');
console.log('2. Copy the "anon public" key');
console.log('3. Update .env.local with the anon key');

console.log('\n📝 Your .env.local should have:');
console.log('NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from Supabase dashboard>');
console.log('SUPABASE_SERVICE_ROLE_KEY=' + serviceRoleKey);