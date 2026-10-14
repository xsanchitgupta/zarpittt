-- =============================================
-- Tracking Enhancement Migration
-- Adds heading, speed, and location_accuracy
-- columns to provider_profiles for real-time
-- marker rotation and idle detection.
-- =============================================

ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS heading DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS speed DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8, 2);

-- Ensure provider_profiles is part of the Realtime publication
-- (it may already be added; this is idempotent in PG 15+)
-- If you get "already member" error, it's safe to ignore.
-- ALTER PUBLICATION supabase_realtime ADD TABLE provider_profiles;

COMMENT ON COLUMN provider_profiles.heading IS 'GPS heading in degrees (0-360). 0 = North, 90 = East.';
COMMENT ON COLUMN provider_profiles.speed IS 'GPS speed in meters/second.';
COMMENT ON COLUMN provider_profiles.location_accuracy IS 'GPS accuracy in meters. Lower = more precise.';
