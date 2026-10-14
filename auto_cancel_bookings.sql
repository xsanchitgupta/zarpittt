-- ====================================================================
-- AUTOMATIC BOOKING CANCELLATION SCRIPT
-- ====================================================================
-- This script implements the logic to automatically cancel bookings
-- that remain unassigned for more than 6 hours.
-- 
-- HOW TO USE:
-- 1. Open your Supabase Dashboard. 
-- 2. Go to the "SQL Editor" on the left sidebar.
-- 3. Paste and run this entire script.
-- 4. Ensure the 'pg_cron' extension is enabled in Database -> Extensions.
-- ====================================================================

-- 1. Add the cancellation_reason column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 2. Create the auto-cancellation function
CREATE OR REPLACE FUNCTION auto_cancel_unassigned_bookings()
RETURNS void AS $$
DECLARE
    booking_count INTEGER;
BEGIN
    -- Update the bookings
    UPDATE bookings
    SET status = 'cancelled',
        cancellation_reason = 'No professional found within 6 hours of placement.',
        updated_at = NOW()
    WHERE status = 'pending'
      AND professional_id IS NULL
      AND created_at < NOW() - INTERVAL '6 hours';
      
    GET DIAGNOSTICS booking_count = ROW_COUNT;
    
    -- Log the action if any bookings were affected
    IF booking_count > 0 THEN
        -- Note: We don't loop here to insert into booking_status_log for performance
        -- but a bulk insert could be added if granular logs are strictly required.
        RAISE NOTICE 'Auto-cancelled % unassigned bookings.', booking_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule the task to run every hour
-- NOTE: This requires the pg_cron extension to be enabled.
-- Uncomment the line below after enabling the extension:
-- SELECT cron.schedule('auto-cancel-unassigned-jobs', '0 * * * *', 'SELECT auto_cancel_unassigned_bookings()');

-- ====================================================================
-- VERIFICATION COMMANDS (Run these to test manually)
-- ====================================================================
-- To test the logic manually without waiting for the cron:
-- SELECT auto_cancel_unassigned_bookings();

-- To see if it worked:
-- SELECT id, booking_number, status, cancellation_reason 
-- FROM bookings 
-- WHERE status = 'cancelled' AND cancellation_reason IS NOT NULL;
