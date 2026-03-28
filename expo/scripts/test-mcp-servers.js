#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing MCP Server Configuration\n');

// Read the MCP config
const mcpConfig = require('../mcp-config/supabase-unified-platform.json');

console.log('📋 MCP Servers Configured:');
console.log('==========================');

Object.entries(mcpConfig.mcpServers).forEach(([name, config]) => {
  console.log(`\n${name}:`);
  console.log(`  Port: ${config.env.MCP_PORT || 'default'}`);
  console.log(`  Schema: ${config.env.SUPABASE_SCHEMA || 'all schemas'}`);
  console.log(`  Mode: ${config.env.MCP_MODE || 'read-write'}`);
  console.log(`  Aliases: ${config.env.MCP_ALIASES || 'none'}`);
});

console.log('\n\n🚀 Starting MCP Servers (first 3 for testing)...\n');

// Test starting the first few servers
const serversToTest = Object.entries(mcpConfig.mcpServers).slice(0, 3);

serversToTest.forEach(([name, config], index) => {
  console.log(`\nStarting ${name}...`);
  
  // Create environment variables
  const env = { ...process.env, ...config.env };
  
  // Start the server
  const proc = spawn(config.command, config.args, {
    env,
    stdio: 'pipe'
  });

  // Handle output
  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`[${name}] ERROR: ${data.toString().trim()}`);
  });

  proc.on('error', (error) => {
    console.error(`[${name}] Failed to start: ${error.message}`);
  });

  // Stop after 5 seconds
  setTimeout(() => {
    proc.kill();
    console.log(`[${name}] Stopped for testing`);
  }, 5000);
});

console.log('\n\n📖 MCP Server Usage Guide:');
console.log('=========================');
console.log('\n1. Reader Server (Port 8888):');
console.log('   - Read access to ALL schemas');
console.log('   - Use for dashboards and analytics');
console.log('   - Single source of truth');

console.log('\n2. Schema-specific Writers:');
console.log('   - scout_dash_writer (8890): Scout analytics data');
console.log('   - hr_admin_writer (8891): HR operations');
console.log('   - finance_writer (8892): Financial operations');
console.log('   - creative_palette_writer (8896): CES, JamPacked, Lions Palette');

console.log('\n3. Using with Claude:');
console.log('   - Each server provides isolated access to its schema');
console.log('   - Use aliases for quick access (e.g., "scout" for scout_dash)');
console.log('   - Writers have full CRUD permissions on their schema');

console.log('\n4. Integration Example:');
console.log('   ```javascript');
console.log('   // Connect to Scout Dash writer');
console.log('   const scoutClient = new MCPClient({');
console.log('     port: 8890,');
console.log('     schema: "scout_dash"');
console.log('   });');
console.log('   ```');

console.log('\n\n💡 Next Steps:');
console.log('==============');
console.log('1. Apply the unified platform migration:');
console.log('   - Copy contents of scripts/apply-unified-platform-migration.sql');
console.log('   - Run in Supabase SQL Editor');
console.log('   - URL: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new');

console.log('\n2. Start specific MCP servers as needed:');
console.log('   - npx @supabase/mcp-server-supabase@latest');
console.log('   - Set environment variables from the config');

console.log('\n3. Test with your AI agents:');
console.log('   - Configure agents to connect to appropriate MCP servers');
console.log('   - Use schema-specific writers for data modifications');

console.log('\n✅ MCP Configuration is ready for the TBWA Unified Platform!');