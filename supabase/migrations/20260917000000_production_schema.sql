-- ═══════════════════════════════════════════════════════════════════
-- CREATIVEORBITZ PRODUCTION DATABASE SCHEMA
-- Migration: 20260917000000_production_schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────────
-- 1. TABLE: leads
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    country TEXT,
    service TEXT,
    budget TEXT,
    message TEXT,
    source TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: project_requests
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    project_type TEXT,
    services TEXT[],
    description TEXT,
    budget TEXT,
    timeline TEXT,
    reference_url TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for project_requests
CREATE INDEX IF NOT EXISTS idx_project_requests_lead_id ON public.project_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_created_at ON public.project_requests(created_at DESC);

-- ───────────────────────────────────────────────────────────────────
-- 3. TABLE: contact_messages
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- ───────────────────────────────────────────────────────────────────
-- 4. TABLE: newsletter
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for newsletter
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter(email);

-- ───────────────────────────────────────────────────────────────────
-- 5. TABLE: projects
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    client TEXT,
    description TEXT,
    thumbnail TEXT,
    video_url TEXT,
    results TEXT,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_projects_published ON public.projects(published);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

-- ═══════════════════════════════════════════════════════════════════
-- DATABASE SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS across all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 1. LEADS POLICIES:
-- Public can INSERT leads (with basic valid email check)
CREATE POLICY "Public insert leads"
    ON public.leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(name) > 0 AND
        length(email) > 3 AND
        email LIKE '%@%.%'
    );

-- Admin & Service Role can view/manage leads
CREATE POLICY "Admin select leads"
    ON public.leads
    FOR SELECT
    TO service_role, authenticated
    USING (true);

CREATE POLICY "Admin update leads"
    ON public.leads
    FOR UPDATE
    TO service_role, authenticated
    USING (true);

CREATE POLICY "Admin delete leads"
    ON public.leads
    FOR DELETE
    TO service_role, authenticated
    USING (true);

-- 2. PROJECT REQUESTS POLICIES:
CREATE POLICY "Public insert project_requests"
    ON public.project_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admin select project_requests"
    ON public.project_requests
    FOR SELECT
    TO service_role, authenticated
    USING (true);

CREATE POLICY "Admin update project_requests"
    ON public.project_requests
    FOR UPDATE
    TO service_role, authenticated
    USING (true);

-- 3. CONTACT MESSAGES POLICIES:
CREATE POLICY "Public insert contact_messages"
    ON public.contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(name) > 0 AND
        length(email) > 3 AND
        length(message) > 0
    );

CREATE POLICY "Admin select contact_messages"
    ON public.contact_messages
    FOR SELECT
    TO service_role, authenticated
    USING (true);

-- 4. NEWSLETTER POLICIES:
CREATE POLICY "Public insert newsletter"
    ON public.newsletter
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(email) > 3 AND
        email LIKE '%@%.%'
    );

CREATE POLICY "Admin select newsletter"
    ON public.newsletter
    FOR SELECT
    TO service_role, authenticated
    USING (true);

-- 5. PROJECTS POLICIES:
-- Public can view published projects
CREATE POLICY "Public select published projects"
    ON public.projects
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

-- Admin full management
CREATE POLICY "Admin full projects management"
    ON public.projects
    FOR ALL
    TO service_role, authenticated
    USING (true);
