-- SQL to add completion OTP column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_otp VARCHAR(6);
