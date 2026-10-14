-- Add sort_order column to services table
ALTER TABLE services ADD COLUMN sort_order INT NOT NULL DEFAULT 0;

-- Initialize sort_order with a sequence based on created_at to maintain a stable order
DO $$
DECLARE
    r RECORD;
    counter INT := 1;
BEGIN
    FOR r IN SELECT id FROM services ORDER BY created_at ASC LOOP
        UPDATE services SET sort_order = counter WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;
