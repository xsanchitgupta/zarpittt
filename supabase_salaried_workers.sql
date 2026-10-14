-- =============================================
-- ZARPIT — Salaried Workers Migration
-- Run this in your Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Add worker_type to provider_profiles
-- 'commission' = standard self-registered professional (default)
-- 'salaried'   = admin-created employee (paid fixed salary)
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS worker_type TEXT DEFAULT 'commission'
  CHECK (worker_type IN ('commission', 'salaried'));

-- 2. Add salary tracking for salaried workers
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS salary_amount INTEGER DEFAULT 0;

-- 3. Track which admin added this worker
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS added_by_admin UUID;

-- 4. Allow admins to insert profiles (needed for creating worker accounts)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (is_admin());

-- 5. Allow admins to insert provider_profiles
DROP POLICY IF EXISTS "Admins can insert provider_profiles" ON public.provider_profiles;
CREATE POLICY "Admins can insert provider_profiles" ON public.provider_profiles
  FOR INSERT WITH CHECK (is_admin());

-- 6. Allow admins to view all provider_profiles
DROP POLICY IF EXISTS "Admins can view all provider_profiles" ON public.provider_profiles;
CREATE POLICY "Admins can view all provider_profiles" ON public.provider_profiles
  FOR SELECT USING (is_admin());

-- 7. Allow admins to update all provider_profiles
DROP POLICY IF EXISTS "Admins can update all provider_profiles" ON public.provider_profiles;
CREATE POLICY "Admins can update all provider_profiles" ON public.provider_profiles
  FOR UPDATE USING (is_admin());
