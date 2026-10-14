-- =========================================================================
-- ZARPIT SQL SCRIPT: Purge Bookings by User Emails (Comprehensive Ordered Delete)
-- =========================================================================
-- This script deletes from all potential child tables (booking_items, payments,
-- booking_status_log, chat_messages, task_assignments) first using inline 
-- subqueries, then purges the parent bookings cleanly.
-- =========================================================================

-- 1. Delete from public.booking_items
DELETE FROM public.booking_items 
WHERE booking_id IN (
  SELECT id FROM public.bookings
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN (
      'xsanchitguptaa@gmail.com',
      'ikhpfu@gmail.com',
      '3arnbeau3@gmail.com'
    )
  )
);

-- 2. Delete from public.payments
DELETE FROM public.payments 
WHERE booking_id IN (
  SELECT id FROM public.bookings
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN (
      'xsanchitguptaa@gmail.com',
      'ikhpfu@gmail.com',
      '3arnbeau3@gmail.com'
    )
  )
);

-- 3. Delete from public.booking_status_log
DELETE FROM public.booking_status_log 
WHERE booking_id IN (
  SELECT id FROM public.bookings
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN (
      'xsanchitguptaa@gmail.com',
      'ikhpfu@gmail.com',
      '3arnbeau3@gmail.com'
    )
  )
);

-- 4. Delete from public.chat_messages
DELETE FROM public.chat_messages 
WHERE booking_id IN (
  SELECT id FROM public.bookings
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN (
      'xsanchitguptaa@gmail.com',
      'ikhpfu@gmail.com',
      '3arnbeau3@gmail.com'
    )
  )
);

-- 5. Delete from public.task_assignments
DELETE FROM public.task_assignments 
WHERE booking_id IN (
  SELECT id FROM public.bookings
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN (
      'xsanchitguptaa@gmail.com',
      'ikhpfu@gmail.com',
      '3arnbeau3@gmail.com'
    )
  )
);

-- 6. Delete from public.bookings
DELETE FROM public.bookings
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE email IN (
    'xsanchitguptaa@gmail.com',
    'ikhpfu@gmail.com',
    '3arnbeau3@gmail.com'
  )
);
