-- Add latitude and longitude to addresses table
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION NULL;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NULL;
