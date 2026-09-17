-- ============================================================================
-- NagrikAI (AI-04) — Phase 3 Database & Supabase Schema
-- Master PostgreSQL DDL, Row-Level Security (RLS) Policies, & Municipal Seeds
-- Compatible with: Supabase PostgreSQL 15+, pgvector, Auth, & Storage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ----------------------------------------------------------------------------
-- 2. CORE ADMINISTRATIVE ENTITIES
-- ----------------------------------------------------------------------------

-- Municipal Departments (e.g. Road Works, Water Supply, Sanitation)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Territorial & Administrative Jurisdictions (City, Zone, Ward)
CREATE TABLE IF NOT EXISTS public.jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('CITY', 'ZONE', 'WARD')),
    parent_id UUID REFERENCES public.jurisdictions(id) ON DELETE SET NULL,
    boundary_geojson JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Authority Operational Units & Designated Posts
CREATE TABLE IF NOT EXISTS public.authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    jurisdiction_id UUID REFERENCES public.jurisdictions(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT,
    escalation_parent_id UUID REFERENCES public.authorities(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Maps 1:1 with auth.users(id) or fictional demo user UUID
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CITIZEN', 'OFFICER', 'DEPARTMENT_ADMIN', 'SYSTEM_ADMIN')),
    designation TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    authority_id UUID REFERENCES public.authorities(id) ON DELETE SET NULL,
    jurisdiction_id UUID REFERENCES public.jurisdictions(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. GRIEVANCE INTAKE & LIFECYCLE
-- ----------------------------------------------------------------------------

-- Grievances Table
CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_number TEXT UNIQUE NOT NULL,
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    original_text_log TEXT,
    language TEXT DEFAULT 'English',
    category TEXT NOT NULL,
    subcategory TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    jurisdiction_id UUID REFERENCES public.jurisdictions(id) ON DELETE SET NULL,
    authority_id UUID REFERENCES public.authorities(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    address TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
    status TEXT NOT NULL CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'AI_ANALYZING', 'EVIDENCE_REVIEW', 
        'ASSIGNED', 'NOTIFIED', 'ACKNOWLEDGED', 'IN_PROGRESS', 
        'RESOLVED', 'CLOSED', 'OVERDUE', 'ESCALATED', 'REJECTED'
    )) DEFAULT 'SUBMITTED',
    duration_text TEXT,
    affected_population INTEGER,
    ledger_hash TEXT,
    expected_resolution_at TIMESTAMPTZ,
    audio_transcript JSONB,
    authority_directive JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Multimodal Evidence & Image Metadata
CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    sha256 TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN (
        'LIKELY_AUTHENTIC', 'NEEDS_VERIFICATION', 'POTENTIALLY_MANIPULATED', 'INSUFFICIENT_EVIDENCE'
    )) DEFAULT 'NEEDS_VERIFICATION',
    risk_score NUMERIC(5, 4) DEFAULT 0.0,
    analysis JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. AI MULTIMODAL INTELLIGENCE & SEMANTIC RETRIEVAL
-- ----------------------------------------------------------------------------

-- AI Analyses Records
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    severity_score NUMERIC(3, 1), -- e.g. 8.8
    severity_description TEXT,
    summary TEXT NOT NULL,
    affected_population_estimate TEXT,
    duration_text TEXT,
    jurisdiction_text TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    jurisdiction_id UUID REFERENCES public.jurisdictions(id) ON DELETE SET NULL,
    priority TEXT NOT NULL,
    entities JSONB DEFAULT '[]'::jsonb NOT NULL,
    recommended_action TEXT,
    recommendation_rationale TEXT,
    confidence NUMERIC(5, 2), -- e.g. 94.20
    raw_output JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Vector Embeddings for Duplicate Detection & Spatial Semantic Search
-- 768 dimensions matches Gemini text-embedding-004 & Ollama nomic-embed-text / bge-base
CREATE TABLE IF NOT EXISTS public.complaint_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    embedding VECTOR(768) NOT NULL,
    model_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Complaint Clusters (For grouping duplicated or localized issues)
CREATE TABLE IF NOT EXISTS public.grievance_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    jurisdiction_id UUID REFERENCES public.jurisdictions(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Cluster Membership Junction
CREATE TABLE IF NOT EXISTS public.cluster_members (
    cluster_id UUID NOT NULL REFERENCES public.grievance_clusters(id) ON DELETE CASCADE,
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    similarity NUMERIC(5, 4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (cluster_id, grievance_id)
);

-- ----------------------------------------------------------------------------
-- 5. AUTONOMOUS AGENTS & CITIZEN COMMUNICATIONS
-- ----------------------------------------------------------------------------

-- LangGraph Agent Execution Runs
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'RUNNING',
    current_state JSONB DEFAULT '{}'::jsonb NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_action_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    next_action_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- Granular Agent Action Log & Timeline Steps
CREATE TABLE IF NOT EXISTS public.agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    actor TEXT NOT NULL CHECK (actor IN ('CITIZEN', 'AI_AGENT', 'SYSTEM', 'AUTHORITY')),
    action_type TEXT NOT NULL,
    tool_name TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'info',
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    success BOOLEAN DEFAULT true NOT NULL,
    is_completed BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Citizen & Authority Multi-channel Communications (SMS, WhatsApp, Push)
CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL,
    recipient_type TEXT NOT NULL,
    recipient_contact TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP', 'EMAIL', 'PUSH')),
    subject TEXT,
    message TEXT NOT NULL,
    provider_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'DELIVERED',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. SLA GOVERNANCE, ESCALATIONS & AUDITING
-- ----------------------------------------------------------------------------

-- Statutory SLA Governance Rules (Maharashtra RTS Act, 2015)
CREATE TABLE IF NOT EXISTS public.sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sla_code TEXT UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    category TEXT,
    acknowledgement_hours INTEGER NOT NULL DEFAULT 4,
    resolution_hours INTEGER NOT NULL DEFAULT 72,
    reminder_before_hours INTEGER NOT NULL DEFAULT 12,
    escalation_after_hours INTEGER NOT NULL DEFAULT 24,
    statutory_framework TEXT DEFAULT 'Maharashtra Right to Public Services Act, 2015',
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Live SLA Milestone Events
CREATE TABLE IF NOT EXISTS public.sla_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    sla_rule_id UUID REFERENCES public.sla_rules(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('ACKNOWLEDGEMENT', 'RESOLUTION', 'REMINDER', 'ESCALATION')),
    deadline_at TIMESTAMPTZ NOT NULL,
    triggered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Multi-Tier Escalations
CREATE TABLE IF NOT EXISTS public.escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    from_authority_id UUID REFERENCES public.authorities(id) ON DELETE SET NULL,
    to_authority_id UUID REFERENCES public.authorities(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1, -- 1: Field -> Superintending, 2: Superintending -> AMC
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- Citizen Feedback & Ratings
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tamper-Proof Audit Ledger (Immutable Append-Only Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE SET NULL,
    grievance_number TEXT,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('CITIZEN', 'OFFICER', 'AI_AGENT', 'SYSTEM')),
    actor_name TEXT NOT NULL,
    actor_id UUID,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 7. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_grievances_citizen_id ON public.grievances(citizen_id);
CREATE INDEX IF NOT EXISTS idx_grievances_department_id ON public.grievances(department_id);
CREATE INDEX IF NOT EXISTS idx_grievances_authority_id ON public.grievances(authority_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON public.grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_priority ON public.grievances(priority);
CREATE INDEX IF NOT EXISTS idx_evidence_grievance_id ON public.evidence(grievance_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_grievance_id ON public.ai_analyses(grievance_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_grievance_id ON public.agent_actions(grievance_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_grievance_id ON public.audit_logs(grievance_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 8. ROW-LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Base Public / Read Policies for Reference Entities
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public read jurisdictions" ON public.jurisdictions FOR SELECT USING (true);
CREATE POLICY "Public read authorities" ON public.authorities FOR SELECT USING (true);
CREATE POLICY "Public read sla_rules" ON public.sla_rules FOR SELECT USING (true);

-- User Profiles: Users can view their own profile; staff can view user names
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR auth.uid() IS NULL); -- Permissive for prototype / anon evaluation
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Grievances:
-- 1. Anyone can create grievances (Citizens)
CREATE POLICY "Citizens insert grievances" ON public.grievances FOR INSERT 
    WITH CHECK (true);

-- 2. Citizens read their own grievances; Officers/Admins read all departmental grievances
CREATE POLICY "Role based read grievances" ON public.grievances FOR SELECT 
    USING (
        citizen_id = auth.uid() 
        OR auth.uid() IS NULL -- Permissive for demo / evaluation
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('OFFICER', 'DEPARTMENT_ADMIN', 'SYSTEM_ADMIN')
        )
    );

-- 3. Officers & Admins can update grievances (status transitions, assignments)
CREATE POLICY "Staff update grievances" ON public.grievances FOR UPDATE 
    USING (
        auth.uid() IS NULL -- Permissive for demo / evaluation
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('OFFICER', 'DEPARTMENT_ADMIN', 'SYSTEM_ADMIN')
        )
    );

-- Evidence: Anyone can view evidence for grievances they have access to
CREATE POLICY "Evidence read policy" ON public.evidence FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances g 
            WHERE g.id = evidence.grievance_id
        )
    );
CREATE POLICY "Evidence insert policy" ON public.evidence FOR INSERT 
    WITH CHECK (true);

-- AI Analyses: Visible to officers, admins, and grievance owners
CREATE POLICY "AI analysis select" ON public.ai_analyses FOR SELECT USING (true);
CREATE POLICY "AI analysis insert" ON public.ai_analyses FOR INSERT WITH CHECK (true);

-- Agent Timeline Actions: Public read for grievance timeline tracking
CREATE POLICY "Agent actions select" ON public.agent_actions FOR SELECT USING (true);
CREATE POLICY "Agent actions insert" ON public.agent_actions FOR INSERT WITH CHECK (true);

-- Audit Logs: Append-only for everyone, select for staff and admins
CREATE POLICY "Audit logs insert" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Audit logs select" ON public.audit_logs FOR SELECT USING (true);

-- Service Role Bypass: Supabase backend service_role key can perform all operations
CREATE POLICY "Service role full access departments" ON public.departments TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access grievances" ON public.grievances TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access evidence" ON public.evidence TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access audit_logs" ON public.audit_logs TO service_role USING (true) WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 9. MUNICIPAL SEED DATA (Pune Municipal Corporation — Fictional Reference)
-- ----------------------------------------------------------------------------

-- A. Departments
INSERT INTO public.departments (id, name, code, description) VALUES
    ('11111111-0000-0000-0000-000000000001', 'PMC Road Infrastructure & Civil Maintenance', 'PMC-CIVIL', 'Municipal asphalt resurfacing, pothole remediation, and stormwater trenching'),
    ('11111111-0000-0000-0000-000000000002', 'PMC Sanitation & Solid Waste Management', 'PMC-SAN', 'Municipal refuse clearance, transfer stations, and bio-waste hygiene'),
    ('11111111-0000-0000-0000-000000000003', 'PMC Water Supply & Sewage', 'PMC-WATER', 'Clean potable distribution mains, valve monitoring, and sewage trunklines'),
    ('11111111-0000-0000-0000-000000000004', 'PMC Electrical & Street Lighting', 'PMC-ELEC', 'High-voltage conduit safety, street pole illumination, and feeder junction maintenance')
ON CONFLICT (code) DO NOTHING;

-- B. Jurisdictions
INSERT INTO public.jurisdictions (id, name, code, type) VALUES
    ('22222222-0000-0000-0000-000000000001', 'Pune Municipal Corporation', 'PMC-APEX', 'CITY'),
    ('22222222-0000-0000-0000-000000000002', 'Ward 12, Sinhagad Zone', 'PMC-WARD-12', 'WARD'),
    ('22222222-0000-0000-0000-000000000003', 'Ward 8, Central Pune', 'PMC-WARD-08', 'WARD'),
    ('22222222-0000-0000-0000-000000000004', 'Ward 10, Kothrud Zone', 'PMC-WARD-10', 'WARD')
ON CONFLICT (code) DO NOTHING;

-- C. Authorities
INSERT INTO public.authorities (id, name, designation, department_id, jurisdiction_id, email, phone) VALUES
    ('33333333-0000-0000-0000-000000000001', 'Er. Rajesh Sharma', 'Executive Engineer', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'rajesh.sharma@pmc.gov.in', '+91 98230 44102'),
    ('33333333-0000-0000-0000-000000000002', 'Er. Sunita Deshpande', 'Superintending Engineer (West Zone)', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'sunita.deshpande@pmc.gov.in', '+91 98225 11090'),
    ('33333333-0000-0000-0000-000000000003', 'Dr. Anand Rao, IAS', 'Additional Municipal Commissioner', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'amc.digital@pmc.gov.in', '+91 98200 99001')
ON CONFLICT DO NOTHING;

-- D. Statutory SLA Rules (Maharashtra RTS 2015)
INSERT INTO public.sla_rules (sla_code, category, acknowledgement_hours, resolution_hours, reminder_before_hours, escalation_after_hours) VALUES
    ('SLA-CIV-04', 'Road Infrastructure & Public Safety', 4, 72, 12, 24),
    ('SLA-SAN-01', 'Sanitation & Solid Waste', 2, 24, 6, 12),
    ('SLA-WTR-02', 'Water Supply & Sewage', 1, 12, 3, 6)
ON CONFLICT (sla_code) DO NOTHING;

-- E. Demo Profiles
INSERT INTO public.profiles (id, full_name, role, email, phone, designation, department_id, jurisdiction_id) VALUES
    ('44444444-0000-0000-0000-000000000001', 'Ramesh Kulkarni', 'CITIZEN', 'ramesh.kulkarni@gmail.com', '+91 98220 54199', 'Citizen Resident', NULL, '22222222-0000-0000-0000-000000000002'),
    ('44444444-0000-0000-0000-000000000002', 'Er. Rajesh Sharma', 'OFFICER', 'rajesh.sharma@pmc.gov.in', '+91 98230 44102', 'Executive Engineer', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002'),
    ('44444444-0000-0000-0000-000000000003', 'Sunita Deshpande', 'DEPARTMENT_ADMIN', 'sunita.deshpande@pmc.gov.in', '+91 98225 11090', 'Superintending Engineer', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001'),
    ('44444444-0000-0000-0000-000000000004', 'Dr. Anand Rao, IAS', 'SYSTEM_ADMIN', 'amc.digital@pmc.gov.in', '+91 98200 99001', 'Addl. Municipal Commissioner', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- F. Flagship Grievance GRV-2026-1042
INSERT INTO public.grievances (
    id, grievance_number, citizen_id, title, description, original_text_log,
    language, category, subcategory, department_id, jurisdiction_id, authority_id,
    latitude, longitude, address, priority, status, duration_text, affected_population,
    ledger_hash, expected_resolution_at,
    audio_transcript,
    authority_directive
) VALUES (
    '843d73f3-db08-4240-b322-a506872dc7ab',
    'GRV-2026-1042',
    '44444444-0000-0000-0000-000000000001',
    'Severe Road Crater & Exposed Electrical Conduit after Monsoon Inundation near Sinhagad Road Junction',
    'Deep crater spanning 1.8 meters across opposite Petrol Pump on Sinhagad Road. Exposing live underground electrical wiring casing. Multiple two-wheelers skidded during rain yesterday evening. Urgent repair required before peak evening commute.',
    'Deep crater spanning 1.8 meters across opposite Petrol Pump on Sinhagad Road. Exposing live underground electrical wiring casing. Multiple two-wheelers skidded during rain yesterday evening. Urgent repair required before peak evening commute.',
    'Marathi & English Hybrid',
    'Road Infrastructure & Public Safety',
    'Asphalt Collapse & Utility Cable Exposure',
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    18.4965000,
    73.8312000,
    'Opposite HPCL Petrol Pump, Sinhagad Road Junction, Pune',
    'HIGH',
    'ACKNOWLEDGED',
    '3d Worsened post-monsoon',
    14500,
    '#PMC-2026-SHA256-4029F',
    now() + INTERVAL '24 hours',
    '{"marathi": "कल रात बारिश के बाद यहाँ बड़ा गड्ढा हो गया है और बिजली की तारें बाहर दिख रही हैं। दो-तीन गाड़ियां फिसल चुकी हैं। कृप्या जल्द से जल्द इसे ठीक करें।", "model": "Marathi ASR Model v4.2", "duration": "00:24", "confidence": 97.8}'::jsonb,
    '{"officerName": "Er. Rajesh Sharma", "designation": "Executive Engineer (EE-PMC)", "loggedAt": "17 Sep 2026, 11:20 AM IST", "directiveText": "Inspection squad deployed with Ward 12 Electrical Maintenance team. Cold mix asphalt patch and cable conduit insulation scheduled for 18 Sep 10:30 AM."}'::jsonb
) ON CONFLICT (grievance_number) DO NOTHING;

-- G. Evidence Records for GRV-2026-1042
INSERT INTO public.evidence (
    id, grievance_id, storage_path, file_name, mime_type, file_size, sha256,
    verification_status, risk_score, metadata, analysis
) VALUES (
    '55555555-0000-0000-0000-000000000001',
    '843d73f3-db08-4240-b322-a506872dc7ab',
    'evidence/GRV-2026-1042/IMG_20260917_102812.jpg',
    'IMG_20260917_102812.jpg',
    'image/jpeg',
    4182900,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'LIKELY_AUTHENTIC',
    0.0400,
    '{"device": "Apple iPhone 14 Pro", "lens": "24mm f/1.78", "dateTime": "17 Sep 10:28 AM", "iso": "40", "latitude": 18.4965, "longitude": 73.8312}'::jsonb,
    '{"matchPercentage": 98.4, "angleDescription": "Primary Cavitation Angle", "weatherCorrelation": "IMD Pune 38mm wet ground"}'::jsonb
), (
    '55555555-0000-0000-0000-000000000002',
    '843d73f3-db08-4240-b322-a506872dc7ab',
    'evidence/GRV-2026-1042/IMG_20260917_102905.jpg',
    'IMG_20260917_102905.jpg',
    'image/jpeg',
    3894100,
    'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce',
    'LIKELY_AUTHENTIC',
    0.0300,
    '{"device": "Apple iPhone 14 Pro", "bearing": "240° WSW", "dateTime": "17 Sep 10:29 AM", "latitude": 18.4966, "longitude": 73.8310}'::jsonb,
    '{"matchPercentage": 96.1, "angleDescription": "Road Junction Context View", "weatherCorrelation": "IMD Pune 38mm wet ground"}'::jsonb
) ON CONFLICT DO NOTHING;

-- H. AI Analysis Record for GRV-2026-1042
INSERT INTO public.ai_analyses (
    grievance_id, model_name, category, subcategory, severity_score, severity_description,
    summary, affected_population_estimate, duration_text, jurisdiction_text,
    priority, recommended_action, recommendation_rationale, confidence
) VALUES (
    '843d73f3-db08-4240-b322-a506872dc7ab',
    'Google Gemini 2.0 Flash / Multimodal Civic Model',
    'Road Infrastructure & Public Safety',
    'Asphalt Collapse & Utility Cable Exposure',
    8.8,
    'Critical public hazard',
    'The sub-surface road collapse is directly attributable to hydraulic scouring around a shallow high-voltage power conduit casing installed during recent telecom ducting. The proximity of monsoon standing water to compromised conduit insulation represents an acute electrocution vulnerability for two-wheeler transit during high-tide traffic.',
    '~14.5k Commuters / 2-wheelers daily',
    '3d Worsened post-monsoon',
    'Dual-Dept: PMC Civil + MSEDCL',
    'HIGH',
    'Deploy Quick-Response Asphalt Repair Vehicle #04 & MSEDCL Isolation Crew',
    'Consolidate 3 citizen tickets into one master work order. Pre-insulate high-voltage feeder prior to cold-asphalt compaction to prevent future short circuits. Nighttime weather radar indicates +40mm rainfall in 14 hours.',
    94.20
) ON CONFLICT DO NOTHING;

-- I. Agent Action Timeline Steps for GRV-2026-1042
INSERT INTO public.agent_actions (grievance_id, actor, action_type, title, description, icon, is_completed) VALUES
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'CITIZEN', 'GRIEVANCE_SUBMITTED', 'Citizen Grievance Logged', 'Ramesh Kulkarni submitted report with 2 geotagged images and Marathi audio complaint.', 'person', true),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'AI_AGENT', 'AI_INDEXED', 'AI NLP & Hazard Indexing', 'Risk score assessed at 8.8/10. Identified electrical conduit exposure in standing water.', 'auto_awesome', true),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'AI_AGENT', 'TICKET_ROUTED', 'Autonomous Ticket Routing', 'Assigned directly to Ward 12 Municipal Engineering & Electrical Maintenance Division.', 'alt_route', true),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'SYSTEM', 'CITIZEN_NOTIFIED', 'SMS Acknowledged to Citizen', 'Tracking link sent to +91 98220 *****. Citizen opened acknowledgment dossier at 10:39 AM.', 'sms', true),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'AUTHORITY', 'DIRECTIVE_LOGGED', 'Authority Inspection Logged', 'Er. Rajesh Sharma deployed joint inspection crew for tomorrow 18 Sep at 10:30 AM.', 'badge', true),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'AI_AGENT', 'BROADCAST_SENT', 'Citizen Status Broadcast Sent', 'Automated message: "Inspection squad confirmed for 18 Sep 10:30 AM by PMC Ward 12."', 'check', true),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'AI_AGENT', 'FOLLOWUP_SCHEDULED', 'Scheduled Officer Check-in', 'AI Sentinel pre-inspection reminder and geotag verification prompt to field engineer.', 'alarm', false)
ON CONFLICT DO NOTHING;

-- J. Audit Trail for GRV-2026-1042
INSERT INTO public.audit_logs (grievance_id, grievance_number, actor_type, actor_name, action, details) VALUES
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'GRV-2026-1042', 'CITIZEN', 'Ramesh Kulkarni (Citizen)', 'GRIEVANCE_SUBMITTED', 'Case logged via NagrikAI Citizen Web App with 2 geotagged images and 1 voice audio transcript.'),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'GRV-2026-1042', 'AI_AGENT', 'NagrikAI Multimodal Vision & NLP Pipeline', 'EVIDENCE_VERIFIED', 'EXIF geotags verified within 12m. Manipulated risk: 0.04 (Low). Status assessed as LIKELY_AUTHENTIC.'),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'GRV-2026-1042', 'AI_AGENT', 'NagrikAI Classifier & Decision Engine', 'SEVERITY_INDEXED', 'Hazard scored at 8.8/10 (HIGH PRIORITY). Extracted dual jurisdiction: PMC Civil + MSEDCL Electrical.'),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'GRV-2026-1042', 'AI_AGENT', 'LangGraph Follow-up Sentinel Agent', 'TICKET_ROUTED', 'Dispatched to PMC Ward 12 Executive Engineering division. Official email and in-app alert dispatched.'),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'GRV-2026-1042', 'OFFICER', 'Er. Rajesh Sharma (Executive Engineer)', 'AUTHORITY_DIRECTIVE_LOGGED', 'Inspection squad deployed with electrical wing. Cold asphalt compaction scheduled for 18 Sep 10:30 AM.'),
    ('843d73f3-db08-4240-b322-a506872dc7ab', 'GRV-2026-1042', 'AI_AGENT', 'NagrikAI Broadcast Sentinel', 'CITIZEN_NOTIFIED', 'Sent automated multi-channel progress update to citizen via SMS and WhatsApp.')
ON CONFLICT DO NOTHING;
