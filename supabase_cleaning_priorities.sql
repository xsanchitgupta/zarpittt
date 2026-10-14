-- =============================================
-- ZARPIT — Prioritize Cleaning Services
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================

UPDATE services
SET sort_order = CASE 
    WHEN name ILIKE '%sweeping%mopping%' THEN 1
    WHEN name ILIKE '%dusting%wi%ing%' THEN 2 -- Handles 'wiping' or 'wipping'
    WHEN name ILIKE '%bathroom%cleaning%' THEN 3
    WHEN name ILIKE '%kitchen%cleaning%' THEN 4
    WHEN name ILIKE '%utensils%cleaning%' THEN 5
    WHEN name ILIKE '%balcony%cleaning%' THEN 6
    WHEN name ILIKE '%door%cleaning%' THEN 7
    WHEN name ILIKE '%window%cleaning%' THEN 8
    WHEN name ILIKE '%appliances%cleaning%' THEN 9
    WHEN name ILIKE '%staircase%cleaning%' THEN 10
    WHEN name ILIKE '%terrace%cleaning%' THEN 11
    WHEN name ILIKE '%wardrobe%arrangement%' THEN 12
    ELSE sort_order
END
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'cleaning');
