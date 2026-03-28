-- TBWA HRIS Quick Setup
-- Run this in Supabase SQL Editor

-- First, run the contents of:
-- backend/db/migrations/001_complete_hris_schema.sql

-- Then, run the contents of:
-- backend/db/migrations/002_unified_platform_schemas.sql

-- Verify setup:
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN (
  'hr_admin', 'financial_ops', 'operations', 'corporate',
  'face_ops', 'creative_palette_ops', 'qa_class', 
  'unified_platform', 'scout_dash'
);

-- Check table count:
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
