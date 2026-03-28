-- TBWA Unified Platform Migration Script
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas first (simpler approach)
DO $$ 
BEGIN
    -- Create all schemas if they don't exist
    CREATE SCHEMA IF NOT EXISTS scout_dash;
    CREATE SCHEMA IF NOT EXISTS hr_admin;
    CREATE SCHEMA IF NOT EXISTS financial_ops;
    CREATE SCHEMA IF NOT EXISTS operations;
    CREATE SCHEMA IF NOT EXISTS corporate;
    CREATE SCHEMA IF NOT EXISTS face_ops;
    CREATE SCHEMA IF NOT EXISTS creative_palette_ops;
    CREATE SCHEMA IF NOT EXISTS qa_class;
    CREATE SCHEMA IF NOT EXISTS unified_platform;
EXCEPTION WHEN OTHERS THEN
    -- Schemas might already exist
    NULL;
END $$;

-- Scout Dash: Campaigns table
CREATE TABLE IF NOT EXISTS scout_dash.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code TEXT UNIQUE NOT NULL,
    campaign_name TEXT NOT NULL,
    client_name TEXT,
    palette_colors JSONB,
    effectiveness_score DECIMAL(5,2),
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('planning', 'active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scout Dash: Stores (Philippine-focused)
CREATE TABLE IF NOT EXISTS scout_dash.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_code TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    store_type TEXT CHECK (store_type IN ('sari-sari', 'mall', 'department', 'supermarket', 'convenience')),
    region TEXT,
    province TEXT,
    city TEXT,
    barangay TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    payment_methods TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creative Palette Ops: Unified creative campaigns
CREATE TABLE IF NOT EXISTS creative_palette_ops.creative_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code TEXT UNIQUE NOT NULL,
    campaign_name TEXT NOT NULL,
    creative_type TEXT CHECK (creative_type IN ('ces', 'jampacked', 'lions_palette')),
    client_id UUID,
    creative_director_id UUID,
    palette_data JSONB,
    ai_insights JSONB,
    effectiveness_metrics JSONB,
    assets_url TEXT[],
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'concept',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creative Palette Ops: Lions Palette Library
CREATE TABLE IF NOT EXISTS creative_palette_ops.palette_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    palette_code TEXT UNIQUE NOT NULL,
    palette_name TEXT NOT NULL,
    colors JSONB NOT NULL,
    industry TEXT,
    brand_association TEXT[],
    emotion_mapping JSONB,
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Face Ops: Senior care
CREATE TABLE IF NOT EXISTS face_ops.seniors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senior_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    contact_info JSONB,
    emergency_contacts JSONB,
    medical_info JSONB,
    care_level TEXT CHECK (care_level IN ('independent', 'assisted', 'full_care')),
    facility_id UUID,
    room_number TEXT,
    enrollment_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA Class: Training courses
CREATE TABLE IF NOT EXISTS qa_class.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT UNIQUE NOT NULL,
    course_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    duration_hours INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    prerequisites TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified Platform: Cross-platform analytics
CREATE TABLE IF NOT EXISTS unified_platform.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_schema TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit TEXT,
    period_start DATE,
    period_end DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add update timestamp function
CREATE OR REPLACE FUNCTION unified_platform.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$ 
BEGIN
    -- Scout Dash triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaigns_updated_at') THEN
        CREATE TRIGGER update_campaigns_updated_at 
        BEFORE UPDATE ON scout_dash.campaigns
        FOR EACH ROW EXECUTE FUNCTION unified_platform.update_updated_at();
    END IF;

    -- Creative triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_creative_campaigns_updated_at') THEN
        CREATE TRIGGER update_creative_campaigns_updated_at 
        BEFORE UPDATE ON creative_palette_ops.creative_campaigns
        FOR EACH ROW EXECUTE FUNCTION unified_platform.update_updated_at();
    END IF;

    -- Face Ops triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_seniors_updated_at') THEN
        CREATE TRIGGER update_seniors_updated_at 
        BEFORE UPDATE ON face_ops.seniors
        FOR EACH ROW EXECUTE FUNCTION unified_platform.update_updated_at();
    END IF;
END $$;

-- Add schema comments
COMMENT ON SCHEMA scout_dash IS 'Scout Analytics - Consumer insights and retail analytics';
COMMENT ON SCHEMA hr_admin IS 'Human Resources and Administration';
COMMENT ON SCHEMA financial_ops IS 'Financial Operations (formerly SUQI-Finance)';
COMMENT ON SCHEMA operations IS 'Operations Management';
COMMENT ON SCHEMA corporate IS 'Corporate Governance and Compliance';
COMMENT ON SCHEMA face_ops IS 'FACE Senior Care Operations';
COMMENT ON SCHEMA creative_palette_ops IS 'Unified Creative Operations - CES, JamPacked, and Lions Palette Forge';
COMMENT ON SCHEMA qa_class IS 'Quality Assurance and Training';
COMMENT ON SCHEMA unified_platform IS 'Cross-platform analytics and AI insights';

-- Insert sample data
INSERT INTO scout_dash.stores (store_code, store_name, store_type, region, province, city, payment_methods) VALUES
    ('SM-001', 'Aling Nena Sari-sari', 'sari-sari', 'NCR', 'Metro Manila', 'Quezon City', ARRAY['cash', 'gcash', 'utang_lista']),
    ('SM-002', 'SM City North EDSA', 'mall', 'NCR', 'Metro Manila', 'Quezon City', ARRAY['cash', 'gcash', 'credit_card']),
    ('SM-003', 'Robinsons Galleria', 'department', 'NCR', 'Metro Manila', 'Pasig City', ARRAY['cash', 'gcash', 'credit_card'])
ON CONFLICT (store_code) DO NOTHING;

INSERT INTO creative_palette_ops.palette_library (palette_code, palette_name, colors, industry, emotion_mapping) VALUES
    ('LP-001', 'Tropical Paradise', 
     '[{"hex": "#FFD700", "name": "Golden Sun", "emotion": "joy"}, 
       {"hex": "#00CED1", "name": "Turquoise Sea", "emotion": "calm"},
       {"hex": "#FF6347", "name": "Coral Reef", "emotion": "energy"}]'::JSONB,
     'Tourism', 
     '{"primary": "joy", "secondary": ["adventure", "relaxation"]}'::JSONB),
    ('LP-002', 'TBWA Black & Yellow', 
     '[{"hex": "#000000", "name": "TBWA Black", "emotion": "power"}, 
       {"hex": "#FFD700", "name": "TBWA Yellow", "emotion": "innovation"}]'::JSONB,
     'Agency', 
     '{"primary": "disruption", "secondary": ["bold", "creative"]}'::JSONB)
ON CONFLICT (palette_code) DO NOTHING;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'TBWA Unified Platform schemas created successfully!';
    RAISE NOTICE 'Schemas created: scout_dash, hr_admin, financial_ops, operations, corporate, face_ops, creative_palette_ops, qa_class, unified_platform';
END $$;