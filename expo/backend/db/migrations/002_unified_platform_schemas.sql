-- TBWA Unified Platform - Multi-Schema Architecture
-- Medallion Lakehouse Pattern with MCP Integration

-- =====================================================
-- SCHEMA CREATION
-- =====================================================

-- Create all platform schemas
CREATE SCHEMA IF NOT EXISTS scout_dash;
CREATE SCHEMA IF NOT EXISTS hr_admin;
CREATE SCHEMA IF NOT EXISTS financial_ops;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS corporate;
CREATE SCHEMA IF NOT EXISTS face_ops;
CREATE SCHEMA IF NOT EXISTS creative_palette_ops;  -- Merged: CES, JamPacked, Lions Palette
CREATE SCHEMA IF NOT EXISTS qa_class;

-- Central schema for cross-platform views and aggregations
CREATE SCHEMA IF NOT EXISTS unified_platform;

-- =====================================================
-- SCOUT DASH SCHEMA (Analytics & Consumer Insights)
-- =====================================================

-- Campaigns table with Lions Palette integration
CREATE TABLE IF NOT EXISTS scout_dash.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code TEXT UNIQUE NOT NULL,
    campaign_name TEXT NOT NULL,
    client_name TEXT,
    palette_colors JSONB,  -- Lions Palette color data
    effectiveness_score DECIMAL(5,2),
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('planning', 'active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handshake events for consumer interactions
CREATE TABLE IF NOT EXISTS scout_dash.handshake_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMPTZ NOT NULL,
    campaign_id UUID REFERENCES scout_dash.campaigns(id),
    consumer_id UUID,
    location_data JSONB,
    interaction_type TEXT,
    demographic_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Philippine retail stores
CREATE TABLE IF NOT EXISTS scout_dash.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_code TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    store_type TEXT CHECK (store_type IN ('sari-sari', 'mall', 'department', 'supermarket', 'convenience')),
    region TEXT,  -- One of 18 Philippine regions
    province TEXT,
    city TEXT,
    barangay TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    payment_methods TEXT[],  -- ['cash', 'gcash', 'utang_lista', etc.]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products catalog
CREATE TABLE IF NOT EXISTS scout_dash.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    unit_price DECIMAL(10,2),
    currency TEXT DEFAULT 'PHP',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS scout_dash.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT UNIQUE NOT NULL,
    store_id UUID REFERENCES scout_dash.stores(id),
    transaction_date TIMESTAMPTZ NOT NULL,
    total_amount DECIMAL(12,2),
    payment_method TEXT,
    campaign_id UUID REFERENCES scout_dash.campaigns(id),
    consumer_demographics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction items
CREATE TABLE IF NOT EXISTS scout_dash.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES scout_dash.transactions(id),
    product_id UUID REFERENCES scout_dash.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HR ADMIN SCHEMA (Already defined in previous migration)
-- Enhanced with face encoding for attendance
-- =====================================================

-- Add face encoding to employees if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hr_admin' 
                   AND table_name = 'employees' 
                   AND column_name = 'face_encoding') THEN
        ALTER TABLE hr_admin.employees ADD COLUMN face_encoding JSONB;
    END IF;
END $$;

-- =====================================================
-- FINANCIAL OPS SCHEMA (Already defined)
-- Renamed from SUQI-Finance
-- =====================================================

-- Schema already exists from previous migration

-- =====================================================
-- CREATIVE PALETTE OPS SCHEMA
-- Merged: CES, JamPacked, and Lions Palette Forge
-- =====================================================

-- Creative campaigns (unified view)
CREATE TABLE IF NOT EXISTS creative_palette_ops.creative_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code TEXT UNIQUE NOT NULL,
    campaign_name TEXT NOT NULL,
    creative_type TEXT CHECK (creative_type IN ('ces', 'jampacked', 'lions_palette')),
    client_id UUID,
    creative_director_id UUID,
    palette_data JSONB,  -- Lions Palette colors and themes
    ai_insights JSONB,   -- JamPacked AI analysis
    effectiveness_metrics JSONB,  -- CES effectiveness scores
    assets_url TEXT[],
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'concept',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creative assets with AI metadata
CREATE TABLE IF NOT EXISTS creative_palette_ops.creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code TEXT UNIQUE NOT NULL,
    asset_name TEXT NOT NULL,
    asset_type TEXT CHECK (asset_type IN ('image', 'video', 'audio', 'document', '3d_model')),
    campaign_id UUID REFERENCES creative_palette_ops.creative_campaigns(id),
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    -- AI-enriched metadata
    color_palette JSONB,
    dominant_colors TEXT[],
    sentiment_analysis JSONB,
    object_detection JSONB,
    brand_compliance_score DECIMAL(5,2),
    -- JamPacked specific
    jam_score DECIMAL(5,2),
    jam_insights JSONB,
    -- CES specific
    effectiveness_prediction DECIMAL(5,2),
    target_audience JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lions Palette color library
CREATE TABLE IF NOT EXISTS creative_palette_ops.palette_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    palette_code TEXT UNIQUE NOT NULL,
    palette_name TEXT NOT NULL,
    colors JSONB NOT NULL,  -- Array of color objects with hex, rgb, emotion scores
    industry TEXT,
    brand_association TEXT[],
    emotion_mapping JSONB,
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FACE OPS SCHEMA (Senior Care Operations)
-- =====================================================

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

CREATE TABLE IF NOT EXISTS face_ops.care_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senior_id UUID REFERENCES face_ops.seniors(id),
    activity_type TEXT NOT NULL,
    activity_timestamp TIMESTAMPTZ NOT NULL,
    caregiver_id UUID,
    notes TEXT,
    vitals JSONB,
    medication_given JSONB,
    mood_assessment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QA CLASS SCHEMA (Quality Assurance & Training)
-- =====================================================

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

CREATE TABLE IF NOT EXISTS qa_class.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES qa_class.courses(id),
    employee_id UUID,
    assessment_date TIMESTAMPTZ NOT NULL,
    score DECIMAL(5,2),
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    status TEXT CHECK (status IN ('passed', 'failed', 'in_progress')),
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- UNIFIED PLATFORM SCHEMA (Cross-Platform Analytics)
-- =====================================================

-- AI Insight Correlations across all platforms
CREATE TABLE IF NOT EXISTS unified_platform.insight_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_schema TEXT NOT NULL,
    source_table TEXT NOT NULL,
    source_id UUID NOT NULL,
    target_schema TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    correlation_type TEXT,
    correlation_strength DECIMAL(5,4),
    ai_insights JSONB,
    recommendations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics aggregator
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

-- =====================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Executive Dashboard View
CREATE MATERIALIZED VIEW IF NOT EXISTS unified_platform.executive_dashboard AS
SELECT 
    -- Scout Analytics
    (SELECT COUNT(*) FROM scout_dash.campaigns WHERE status = 'active') as active_campaigns,
    (SELECT SUM(total_amount) FROM scout_dash.transactions 
     WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days') as monthly_revenue,
    
    -- HR Metrics
    (SELECT COUNT(*) FROM hr_admin.employees WHERE is_active = true) as active_employees,
    (SELECT AVG(EXTRACT(days FROM age(CURRENT_DATE, hire_date))/365.25) 
     FROM hr_admin.employment_info ei 
     JOIN hr_admin.employees e ON ei.profile_id = e.id 
     WHERE e.is_active = true) as avg_tenure_years,
    
    -- Financial Metrics
    (SELECT SUM(amount) FROM financial_ops.expenses 
     WHERE status = 'Approved' AND expense_date >= CURRENT_DATE - INTERVAL '30 days') as monthly_expenses,
    
    -- Creative Metrics
    (SELECT COUNT(*) FROM creative_palette_ops.creative_campaigns 
     WHERE status != 'archived') as active_creative_projects,
    
    -- Operations Metrics
    (SELECT COUNT(*) FROM operations.projects WHERE status = 'active') as active_projects,
    
    updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create refresh function
CREATE OR REPLACE FUNCTION unified_platform.refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY unified_platform.executive_dashboard;
    -- Add other materialized views here as needed
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Scout Dash indexes
CREATE INDEX idx_campaigns_status ON scout_dash.campaigns(status);
CREATE INDEX idx_handshake_campaign ON scout_dash.handshake_events(campaign_id);
CREATE INDEX idx_stores_region ON scout_dash.stores(region);
CREATE INDEX idx_stores_type ON scout_dash.stores(store_type);
CREATE INDEX idx_transactions_date ON scout_dash.transactions(transaction_date);
CREATE INDEX idx_transactions_store ON scout_dash.transactions(store_id);

-- Creative Palette indexes
CREATE INDEX idx_creative_campaigns_type ON creative_palette_ops.creative_campaigns(creative_type);
CREATE INDEX idx_creative_campaigns_status ON creative_palette_ops.creative_campaigns(status);
CREATE INDEX idx_creative_assets_campaign ON creative_palette_ops.creative_assets(campaign_id);
CREATE INDEX idx_palette_library_industry ON creative_palette_ops.palette_library(industry);

-- Unified Platform indexes
CREATE INDEX idx_insight_correlations_source ON unified_platform.insight_correlations(source_schema, source_table, source_id);
CREATE INDEX idx_insight_correlations_target ON unified_platform.insight_correlations(target_schema, target_table, target_id);
CREATE INDEX idx_performance_metrics_entity ON unified_platform.performance_metrics(entity_schema, entity_table, entity_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE scout_dash.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.handshake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_palette_ops.creative_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_palette_ops.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_ops.seniors ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_class.courses ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (extend as needed)
CREATE POLICY "Public read access" ON scout_dash.campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated write access" ON scout_dash.campaigns FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION unified_platform.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON scout_dash.campaigns
    FOR EACH ROW EXECUTE FUNCTION unified_platform.update_updated_at();

CREATE TRIGGER update_creative_campaigns_updated_at BEFORE UPDATE ON creative_palette_ops.creative_campaigns
    FOR EACH ROW EXECUTE FUNCTION unified_platform.update_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA scout_dash IS 'Scout Analytics - Consumer insights and retail analytics';
COMMENT ON SCHEMA hr_admin IS 'Human Resources and Administration';
COMMENT ON SCHEMA financial_ops IS 'Financial Operations (formerly SUQI-Finance)';
COMMENT ON SCHEMA operations IS 'Operations Management';
COMMENT ON SCHEMA corporate IS 'Corporate Governance and Compliance';
COMMENT ON SCHEMA face_ops IS 'FACE Senior Care Operations';
COMMENT ON SCHEMA creative_palette_ops IS 'Unified Creative Operations - CES, JamPacked, and Lions Palette Forge';
COMMENT ON SCHEMA qa_class IS 'Quality Assurance and Training';
COMMENT ON SCHEMA unified_platform IS 'Cross-platform analytics and AI insights';

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample Philippine regions
INSERT INTO scout_dash.stores (store_code, store_name, store_type, region, province, city, payment_methods) VALUES
    ('SM-001', 'Aling Nena Sari-sari', 'sari-sari', 'NCR', 'Metro Manila', 'Quezon City', ARRAY['cash', 'gcash', 'utang_lista']),
    ('SM-002', 'SM City North EDSA', 'mall', 'NCR', 'Metro Manila', 'Quezon City', ARRAY['cash', 'gcash', 'credit_card']),
    ('SM-003', 'Robinsons Galleria', 'department', 'NCR', 'Metro Manila', 'Pasig City', ARRAY['cash', 'gcash', 'credit_card'])
ON CONFLICT (store_code) DO NOTHING;

-- Insert sample palette
INSERT INTO creative_palette_ops.palette_library (palette_code, palette_name, colors, industry, emotion_mapping) VALUES
    ('LP-001', 'Tropical Paradise', 
     '[{"hex": "#FFD700", "name": "Golden Sun", "emotion": "joy"}, 
       {"hex": "#00CED1", "name": "Turquoise Sea", "emotion": "calm"},
       {"hex": "#FF6347", "name": "Coral Reef", "emotion": "energy"}]'::JSONB,
     'Tourism', 
     '{"primary": "joy", "secondary": ["adventure", "relaxation"]}'::JSONB)
ON CONFLICT (palette_code) DO NOTHING;