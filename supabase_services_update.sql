-- 1. Add the new columns to the services table if they don't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS included TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS not_included TEXT[] DEFAULT '{}';

-- 2. Update existing services with data from the Dos and Donts guidelines
-- Note: Replace 'category-slug' with your actual category IDs or slugs as per your database

-- Cleaning services
UPDATE services SET 
  included = ARRAY['All indoor rooms swept & mopped', 'Bathroom cleaning (toilet, basin, tiles, floor)', 'Kitchen countertops, cabinets & stove cleaning', 'Dusting of furniture, shelves & fixtures', 'Window sills & door frames wiped'],
  not_included = ARRAY['Balcony/terrace/outdoor areas', 'Heavy furniture moving', 'Deep stain removal or polishing', 'Inside drawers/cabinets', 'Appliance interiors (chimney, oven, fridge)']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'cleaning');

-- Laundry services
UPDATE services SET 
  included = ARRAY['Wash & fold', 'Ironing', 'Stain removal', 'Doorstep pickup & delivery'],
  not_included = ARRAY['Dry cleaning of delicates', 'Leather or suede items', 'Heavy curtains or carpets', 'Shoe cleaning']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'laundry');

-- Pandit services
UPDATE services SET 
  included = ARRAY['Puja samagri provided', 'Havan & all rituals', 'Auspicious timing consultation', 'Vedic mantras & chanting'],
  not_included = ARRAY['Non-standard rituals without prior discussion', 'Venue decoration', 'Food or prasad arrangement', 'Post-event cleanup']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'pandit');

-- Cooking services
UPDATE services SET 
  included = ARRAY['Daily meals preparation', 'Party/event cooking', 'Multi-cuisine options', 'Kitchen cleanup after cooking'],
  not_included = ARRAY['Grocery shopping', 'Serving at the table', 'Dishes or utensil washing beyond cooking', 'Specialty baking or confectionery']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'cooking');

-- Safety Person
UPDATE services SET 
  included = ARRAY['Background verified guard', 'Day or night shift coverage', 'Emergency response trained', 'Visitor log management'],
  not_included = ARRAY['Armed security', 'CCTV installation or monitoring', 'Personal bodyguard duties', 'Overnight stays without arrangement']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'safety-person');

-- Baby Care
UPDATE services SET 
  included = ARRAY['Feeding assistance', 'Diaper changing', 'Play supervision', 'Nap routines & soothing'],
  not_included = ARRAY['Medical or nursing care', 'Overnight stays', 'Cooking for the household', 'Cleaning beyond baby area']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'baby-care');

-- Pregnancy Care
UPDATE services SET 
  included = ARRAY['Health monitoring assistance', 'Meal preparation', 'Light housework', 'Emotional support & companionship'],
  not_included = ARRAY['Medical diagnosis or prescriptions', 'Heavy lifting or deep cleaning', 'Driving or transportation', 'Overnight stays without arrangement']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'pregnancy-care');

-- Old Parents Care
UPDATE services SET 
  included = ARRAY['Medicine reminders', 'Mobility support', 'Meal assistance', 'Companionship & conversation'],
  not_included = ARRAY['Medical or nursing procedures', 'Heavy lifting', 'Driving or transportation', 'Overnight stays without arrangement']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'old-parents-care');

-- Pet Walker
UPDATE services SET 
  included = ARRAY['Dog walking (1 hour)', 'Pet feeding', 'Basic grooming', 'Exercise & play routine'],
  not_included = ARRAY['Veterinary care', 'Aggressive animal handling', 'Overnight pet sitting', 'Pet transportation']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'pet-walker');

-- Doctor at home
UPDATE services SET 
  included = ARRAY['General checkup', 'Prescription', 'Basic lab advice', 'Follow-up call'],
  not_included = ARRAY['Surgery or procedures', 'Specialized diagnostic tests', 'Emergency/trauma care', 'Pharmacy delivery']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'doctor');

-- Luggage Shifter
UPDATE services SET 
  included = ARRAY['Packing materials provided', 'Loading & unloading', 'Furniture dismantling & reassembly', 'Safe transport'],
  not_included = ARRAY['Storage facility', 'Insurance for valuables', 'International shipping', 'Disposal of old items']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'luggage-shifter');

-- Bike Mechanic
UPDATE services SET 
  included = ARRAY['Engine check & diagnostics', 'Oil change', 'Brake service', 'Tire repair & inflation'],
  not_included = ARRAY['Spare parts cost (billed separately)', 'Major engine overhaul', 'Body painting or denting', 'Towing service']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'mechanic');

-- Haircut
UPDATE services SET 
  included = ARRAY['Haircut & styling', 'Hair wash', 'Beard trim', 'Hot towel finish'],
  not_included = ARRAY['Hair coloring or highlights', 'Chemical treatments (keratin, smoothing)', 'Facial or skin treatments', 'Product cost (billed separately)']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'haircut');
