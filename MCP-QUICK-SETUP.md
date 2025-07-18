# Quick MCP Setup for TBWA HRIS Platform

## 1. Get Your Personal Access Token (PAT)

Visit: https://app.supabase.com/account/tokens

Create a new token named "Claude MCP Server" and save it.

## 2. Configure MCP (Choose One Method)

### Option A: Claude Desktop (Recommended)
Create/edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=cxzllzyxwpyptfretryc"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PAT_HERE"
      }
    }
  }
}
```

### Option B: Claude Code (Project-specific)
Create `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=cxzllzyxwpyptfretryc"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PAT_HERE"
      }
    }
  }
}
```

### Option C: Using Service Role Key (Full Access)
If you have the service role key from `.env.local`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_PROJECT_REF": "cxzllzyxwpyptfretryc",
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI"
      }
    }
  }
}
```

## 3. Restart Your Tool

- **Claude Desktop**: Quit and restart the app
- **Claude Code**: Reload the window or restart
- **Cursor**: Restart the editor

## 4. Test the Connection

Ask Claude:
- "List all schemas in the database"
- "Show tables in the scout_dash schema"
- "Get the schema definition for the campaigns table"

## Available MCP Tools

- `list_projects`: See all your Supabase projects
- `get_project_config`: Get configuration details
- `run_sql`: Execute SQL queries directly
- `get_schema`: Inspect database schema
- `create_table`: Create new tables
- `list_functions`: View Edge Functions
- `list_buckets`: See storage buckets
- `list_secrets`: View environment variables

## Security Notes

1. **Always use read-only mode** for general queries
2. **Never share your PAT** publicly
3. **Use development projects only** - not production
4. **Review all SQL** before execution

## Troubleshooting

If MCP isn't working:

1. Check the configuration file location
2. Ensure PAT is valid and has correct permissions
3. Verify project ref matches: `cxzllzyxwpyptfretryc`
4. Check Claude's MCP status in settings

## Next Steps

Once connected, you can:
- Apply database migrations directly
- Query data without copy-paste
- Create and modify schemas programmatically
- Manage Edge Functions and storage

Remember: With MCP, there's no need to copy-paste SQL anymore!