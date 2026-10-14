-- =============================================
-- ZARPIT — Schema Updates (Ban & Maintenance)
-- Run this in your Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Add ban_reason to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL;

-- 2. Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies for system_settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Public read settings'
    ) THEN
        CREATE POLICY "Public read settings" ON public.system_settings FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Admins manage settings'
    ) THEN
        CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- 5. Seed initial maintenance mode settings
INSERT INTO public.system_settings (key, value) VALUES ('maintenance_mode', 'false') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.system_settings (key, value) VALUES ('maintenance_reason', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.system_settings (key, value) VALUES ('maintenance_eta', '') ON CONFLICT (key) DO NOTHING;
