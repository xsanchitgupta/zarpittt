-- SQL Script to safely wipe test transactions and users while keeping the catalog and admin intact.
-- Make sure to run this in your Supabase SQL Editor.

-- 1. Wipe all transactional data (Bookings, Cart, Addresses)
-- We use CASCADE in case there are any dependent tables, but this will ONLY affect the listed tables and their dependents.
TRUNCATE TABLE 
    public.booking_items, 
    public.bookings, 
    public.cart_items, 
    public.addresses 
RESTART IDENTITY CASCADE;

-- 2. Delete all users from the auth schema EXCEPT the specified admin email
-- This will automatically cascade and delete the corresponding rows in public.user_profiles 
-- (assuming the foreign key is set to ON DELETE CASCADE).
DELETE FROM auth.users 
WHERE email != '3arnbeau3@gmail.com';

-- 3. Safety Check: Manually delete any orphaned profiles just in case the foreign key CASCADE isn't set up.
DELETE FROM public.profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email = '3arnbeau3@gmail.com'
);

-- Done! Your services, categories, variants, etc. are untouched!
