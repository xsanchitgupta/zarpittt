-- 1. Add 'variants' JSONB column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- 2. Add 'variant_name' TEXT column to cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_name TEXT DEFAULT '';

-- 3. Update Unique Constraint on cart_items
-- We drop the old constraint that only checked user_id and service_id
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_service_id_key;

-- Then we add the new constraint that includes variant_name
-- This allows users to add different variants of the same service
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_service_id_variant_name_key UNIQUE (user_id, service_id, variant_name);
