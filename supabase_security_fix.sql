-- =====================================================================
-- ZARPIT — SECURITY FIX: lock down profiles & provider_profiles
--
-- WHY: With only the public anon key, anyone could read every row of
--   public.profiles (email, phone, name, role) and public.provider_profiles
--   (Aadhaar, PAN, bank account, IFSC, driving license, selfie, live GPS).
--   Postgres OR's all RLS policies together, so a single leftover
--   permissive "USING (true)" SELECT policy exposes the whole table.
--
-- WHAT THIS DOES:
--   1. Creates a safe public.is_admin() helper (SECURITY DEFINER so it can
--      never cause RLS recursion — it reads profiles as the table owner).
--   2. Enables RLS and removes ALL existing policies on the two tables.
--   3. Recreates only the correct owner/admin policies.
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste -> Run.
--   Safe to run more than once (idempotent).
-- =====================================================================

-- 1. Admin helper (create or replace — no dependency on it existing first)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER          -- runs as owner, bypasses RLS => no recursion
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- =====================================================================
-- profiles
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop every existing policy on profiles (removes any permissive public-read leftover)
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert_self_or_admin" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- =====================================================================
-- provider_profiles
-- =====================================================================
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'provider_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.provider_profiles', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "provider_profiles_select_own_or_admin" ON public.provider_profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "provider_profiles_insert_own_or_admin" ON public.provider_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "provider_profiles_update_own_or_admin" ON public.provider_profiles
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "provider_profiles_delete_admin" ON public.provider_profiles
  FOR DELETE USING (public.is_admin());

-- =====================================================================
-- NOTES
-- =====================================================================
-- 1. Customer-facing features that show a worker's name/avatar for an
--    assigned booking read through the SERVICE-ROLE key in server routes
--    (/api/orders, /api/chat), which bypasses RLS — so this does NOT break
--    booking details, chat, or tracking.
--
-- 2. After running, verify as an ANONYMOUS client (public anon key) — both
--    should return permission denied / 0 rows:
--        select id, email from profiles;
--        select user_id, aadhaar_number from provider_profiles;
--
-- 3. Confirm no other table is unintentionally public-readable:
--        select tablename, policyname
--        from pg_policies
--        where schemaname='public' and cmd='SELECT' and qual = 'true';
--    Only categories / services / testimonials / service_areas /
--    system_settings should appear.
-- =====================================================================
