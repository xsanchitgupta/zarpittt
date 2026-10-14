-- =====================================================
-- Dynamic Scheduling & Order Grouping Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add scheduling columns to services
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS buffer_time NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS variant_durations JSONB DEFAULT '{}';

-- 2. Add scheduling columns to bookings
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS group_id TEXT;

-- 3. Create system_settings table for global config
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure description column exists in case the table was already there
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert default buffer setting (30 mins = 0.5 hrs)
INSERT INTO system_settings (key, value, description) 
VALUES ('order_buffer_minutes', '30', 'Buffer time in minutes added after each order (not per-service)')
ON CONFLICT (key) DO NOTHING;

-- 4. Set durations for all existing services
-- Sweeping and Mopping: RK=30, 1BHK=40, 2BHK=50, 3BHK=60
UPDATE services SET 
  duration_minutes = 30,
  buffer_time = 0.5,
  variant_durations = '{"RK": 30, "1 BHK": 40, "2 BHK": 50, "3 BHK": 60}'::jsonb
WHERE LOWER(name) LIKE '%sweeping%' OR LOWER(name) LIKE '%mopping%';

-- Dusting: RK=15, 1BHK=30, 2BHK=40, 3BHK=60
UPDATE services SET 
  duration_minutes = 15,
  buffer_time = 0.5,
  variant_durations = '{"RK": 15, "1 BHK": 30, "2 BHK": 40, "3 BHK": 60}'::jsonb
WHERE LOWER(name) LIKE '%dusting%';

-- 30-minute services
UPDATE services SET duration_minutes = 30, buffer_time = 0.5
WHERE LOWER(name) IN ('balcony cleaning', 'utensils cleaning', 'door cleaning', 'windows', 'window cleaning', 'staircase cleaning', 'wardrobe cleaning');

-- 60-minute services
UPDATE services SET duration_minutes = 60, buffer_time = 0.5
WHERE LOWER(name) IN ('kitchen cleaning', 'bathroom cleaning', 'terrace cleaning');

-- Default all remaining services to 60 mins with 0.5hr buffer if not yet set
UPDATE services SET 
  duration_minutes = COALESCE(duration_minutes, 60),
  buffer_time = COALESCE(buffer_time, 0.5);

-- 5. Index for grouping queries
CREATE INDEX IF NOT EXISTS idx_bookings_group_id ON bookings(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, scheduled_date);

-- 6. Add RLS policies for system_settings (read-only for all, write for service_role)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system_settings" ON system_settings
  FOR SELECT USING (true);

-- Done! Verify with:
-- SELECT name, duration_minutes, buffer_time, variant_durations FROM services;
-- SELECT * FROM system_settings;
