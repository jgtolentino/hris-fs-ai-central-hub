# TBWA Unified Platform Setup Guide

## Overview

The TBWA Unified Platform integrates multiple business units into a cohesive system with dedicated schemas and MCP (Model Context Protocol) servers for AI-powered operations.

## Architecture

### Schemas Created

1. **scout_dash** - Scout Analytics & Consumer Insights
2. **hr_admin** - Human Resources Administration  
3. **financial_ops** - Financial Operations (renamed from SUQI-Finance)
4. **operations** - Operations Management
5. **corporate** - Corporate Governance
6. **face_ops** - FACE Senior Care Operations
7. **creative_palette_ops** - Unified Creative Operations (merged CES, JamPacked, Lions Palette)
8. **qa_class** - Quality Assurance & Training
9. **unified_platform** - Cross-platform Analytics & AI Insights

### MCP Server Configuration

- **Reader Server (Port 8888)**: Read-only access to all schemas
- **Writer Servers**: Schema-specific write access on dedicated ports
  - scout_dash_writer: 8890
  - hr_admin_writer: 8891
  - finance_writer: 8892
  - operations_writer: 8893
  - corporate_writer: 8894
  - face_ops_writer: 8895
  - creative_palette_writer: 8896
  - qa_class_writer: 8897

## Setup Instructions

### 1. Apply Database Migration

Copy the contents of `scripts/apply-unified-platform-migration.sql` and run in Supabase SQL Editor:

```bash
# Open in browser
https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

# Paste and execute the SQL script
```

### 2. Verify Configuration

```bash
# Test the complete setup
node scripts/test-complete-setup.js

# Test MCP servers
node scripts/test-mcp-servers.js
```

### 3. Start Development Services

```bash
# Start all services
./start-dev.sh

# Or start individually:
# Backend API
cd backend/api && npm run dev

# Mobile app
cd apps/mobile && npm run ios

# Web admin
cd apps/web-admin && npm run dev
```

## Key Features by Schema

### Scout Dash
- Campaign management with Lions Palette integration
- Philippine retail store tracking (sari-sari, malls, etc.)
- Consumer handshake events
- Transaction analytics

### Creative Palette Ops (Unified)
- **CES**: Campaign Effectiveness Scoring
- **JamPacked**: AI-powered creative insights
- **Lions Palette**: Color psychology and brand compliance
- Unified creative asset management

### Financial Ops
- Multi-currency expense tracking
- Policy engine with violation detection
- Approval workflows
- Audit logging

### Face Ops
- Senior care management
- Care activity tracking
- Vitals monitoring
- Medication management

## Using MCP Servers

### Example: Connect to Scout Dash

```javascript
// Using the reader (read-only)
const readerClient = createMCPClient({
  port: 8888,
  mode: 'read_only'
});

// Using the writer (full access)
const scoutWriter = createMCPClient({
  port: 8890,
  schema: 'scout_dash'
});
```

### Example: Query Creative Campaigns

```javascript
// Get all active creative campaigns
const campaigns = await creativeWriter.query({
  table: 'creative_campaigns',
  filter: { status: 'active' },
  include: ['palette_data', 'ai_insights']
});
```

## Philippine-Specific Features

- **Store Types**: sari-sari, mall, department, supermarket, convenience
- **Payment Methods**: cash, gcash, utang_lista, credit_card
- **18 Regions**: Full Philippine regional support
- **Barangay-level addressing**

## Security & Access Control

- Row Level Security (RLS) enabled on all tables
- Service role key for backend operations
- Anon key for client-side authentication
- Schema isolation for multi-tenant security

## Monitoring & Analytics

The unified_platform schema provides:
- Cross-schema performance metrics
- AI insight correlations
- Executive dashboard views
- Real-time analytics aggregation

## Next Steps

1. Configure your AI agents to use appropriate MCP servers
2. Set up monitoring dashboards using the reader server
3. Implement schema-specific business logic
4. Configure cross-schema workflows via unified_platform

## Support

- Supabase Dashboard: https://app.supabase.com/project/cxzllzyxwpyptfretryc
- API Keys: Available in Settings > API
- Database Password: Required for direct SQL access

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

The TBWA Unified Platform is now ready for AI-powered operations across all business units!