-- Phase 15: Citizen Notifications Table & RLS
CREATE TABLE IF NOT EXISTS public.citizen_notifications (
    id TEXT PRIMARY KEY,
    grievance_id TEXT NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    citizen_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    event_type TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    channel TEXT NOT NULL DEFAULT 'ALL',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_citizen_notifs_citizen_id ON public.citizen_notifications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizen_notifs_grievance_id ON public.citizen_notifications(grievance_id);
CREATE INDEX IF NOT EXISTS idx_citizen_notifs_read ON public.citizen_notifications(read);
CREATE INDEX IF NOT EXISTS idx_citizen_notifs_created_at ON public.citizen_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.citizen_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read
CREATE POLICY "Allow authenticated read on citizen_notifications"
    ON public.citizen_notifications
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Allow authenticated update (mark read)
CREATE POLICY "Allow authenticated update on citizen_notifications"
    ON public.citizen_notifications
    FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow full access for service_role"
    ON public.citizen_notifications
    FOR ALL
    TO service_role
    USING (true);
