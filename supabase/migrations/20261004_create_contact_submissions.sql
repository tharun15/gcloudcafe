-- GCloudCafe Contact Submissions Table Migration
-- Run this in the Supabase Dashboard SQL Editor (https://app.supabase.com) to enable PostgreSQL storage

CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'general',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors (via publishable anon key) to INSERT contact submissions
CREATE POLICY "Allow anonymous insert on contact_submissions"
    ON public.contact_submissions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow only authenticated admins or service_role to SELECT/VIEW contact submissions
CREATE POLICY "Allow service_role full access on contact_submissions"
    ON public.contact_submissions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Helpful index for chronological query sorting
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON public.contact_submissions (created_at DESC);
