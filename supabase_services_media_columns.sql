-- =====================================================================
-- ZARPIT — Add missing media columns to services
--
-- The admin "Edit Service" form supports a photo gallery and a video URL,
-- but these columns don't exist in the live DB, which caused
-- "Could not find the 'gallery_images' column ... in the schema cache"
-- and made the whole save (including price) fail.
--
-- The app now saves even without these columns (it skips them), but run
-- this once to enable the gallery + video features fully.
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste -> Run.
--   Safe to run more than once.
-- =====================================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Verify
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='services'
--   AND column_name IN ('gallery_images','video_url');
