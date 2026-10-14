-- =============================================
-- ZARPIT — Coming Soon Feature Migration
-- Run this in your Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Add is_coming_soon to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT FALSE;

-- 2. Add is_coming_soon to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT FALSE;
