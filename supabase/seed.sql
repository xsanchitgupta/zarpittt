-- =============================================
-- ZARPIT — Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- =============================================

-- Categories
INSERT INTO categories (id, name, slug, icon, image, sort_order) VALUES
  ('cleaning', 'Cleaning', 'cleaning', '🧹', '/images/cleaning.png', 1),
  ('laundry', 'Laundry', 'laundry', '👔', '/images/laundry.png', 2),
  ('cooking', 'Cooking', 'cooking', '👨‍🍳', '/images/cooking.png', 3),
  ('baby-care', 'Baby Care', 'baby-care', '👶', '/images/baby-care.png', 4),
  ('elder-care', 'Elder Care', 'elder-care', '🤝', '/images/elder-care.png', 5),
  ('pandit', 'Pandit Ji Booking', 'pandit', '🙏', '/images/pandit.png', 6),
  ('doctor', 'Doctor', 'doctor', '🩺', '/images/doctor.png', 7),
  ('pet-care', 'Pet Care', 'pet-care', '🐾', '/images/pet-care.png', 8),
  ('mechanic', 'Mechanic', 'mechanic', '🔧', '/images/mechanic.png', 9),
  ('gardener', 'Gardener', 'gardener', '🌿', '/images/gardener.png', 10),
  ('haircut', 'Hair Cut', 'haircut', '✂️', '/images/salon.png', 11),
  ('luggage-shifter', 'Luggage Shifter', 'luggage-shifter', '📦', '/images/luggage-shifter.png', 12)
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (id, name, category_id, price, original_price, discount, rating, reviews, duration, image, badge, description, included, slug) VALUES
  (1, 'Deep Home Cleaning', 'cleaning', 1999, 3499, 43, 4.9, 5120, '4 hrs', '/images/cleaning.png', 'Bestseller', 'Complete deep cleaning of your home including kitchen, bathrooms, floors, and all rooms. Eco-friendly products used by trained professionals.', ARRAY['Kitchen deep clean & degreasing','Bathroom scrubbing & disinfection','Floor mopping & vacuuming','Dusting all surfaces & fans','Window & glass cleaning','Balcony cleaning'], 'deep-home-cleaning'),
  (2, 'Bathroom Cleaning', 'cleaning', 499, 899, 44, 4.7, 3200, '1.5 hrs', '/images/cleaning.png', NULL, 'Thorough bathroom cleaning with scrubbing, descaling, disinfecting, and tile cleaning.', ARRAY['Tile scrubbing','Toilet deep clean','Mirror & glass polish','Drain clearing','Disinfectant spray'], 'bathroom-cleaning'),
  (3, 'Wash & Iron — 20 Pieces', 'laundry', 399, 699, 43, 4.8, 4500, '24 hrs', '/images/laundry.png', 'Top Rated', 'Professional wash and iron service for up to 20 pieces. Pickup and delivery at your doorstep.', ARRAY['Machine wash with premium detergent','Steam iron pressing','Folding & packaging','Free pickup & delivery','Fabric softener treatment'], 'wash-iron-20'),
  (4, 'Dry Cleaning — Premium', 'laundry', 199, 399, 50, 4.6, 1800, '48 hrs', '/images/laundry.png', NULL, 'Premium dry cleaning per garment — suits, sarees, lehengas, and delicates handled with care.', ARRAY['Gentle dry cleaning solvent','Spot treatment','Professional pressing','Protective packaging','Free delivery'], 'dry-cleaning-premium'),
  (5, 'Daily Home Cook', 'cooking', 6999, 9999, 30, 4.8, 2100, 'Monthly', '/images/cooking.png', 'Bestseller', 'Professional cook at your home for daily meals. Breakfast, lunch, and dinner — North Indian, South Indian, and Continental cuisines.', ARRAY['2 meals per day','Menu customization','Grocery list assistance','Hygiene certified cook','Background verified'], 'daily-home-cook'),
  (6, 'Party/Event Cook', 'cooking', 2499, 4999, 50, 4.9, 890, '4-6 hrs', '/images/cooking.png', 'Premium', 'Experienced cooks for parties, kitty parties, birthday celebrations, and house events. Up to 30 guests.', ARRAY['Menu planning','Ingredient shopping assistance','Cooking for up to 30 guests','Cleanup after cooking','Multi-cuisine options'], 'party-event-cook'),
  (7, 'Full-Time Nanny', 'baby-care', 14999, 19999, 25, 4.9, 1560, 'Monthly', '/images/baby-care.png', 'Top Rated', 'Trained, background-verified full-time nanny for your baby. CPR trained, experienced with infants and toddlers.', ARRAY['8 hrs/day — 6 days/week','Feeding & diaper changes','Play activities','Sleep routine management','CPR certified','Background verified'], 'full-time-nanny'),
  (8, 'Babysitter — 4 Hours', 'baby-care', 899, 1499, 40, 4.7, 2300, '4 hrs', '/images/baby-care.png', NULL, 'Certified babysitter for 4 hours. Perfect for date nights, errands, or work-from-home days.', ARRAY['4 hours of care','Feeding & nap time','Indoor activities','First-aid trained','Instant booking'], 'babysitter-4hrs'),
  (9, 'Elder Companion — Daily', 'elder-care', 12999, 17999, 28, 4.8, 890, 'Monthly', '/images/elder-care.png', 'Premium', 'Compassionate daily companion for senior citizens. Help with mobility, medication reminders, and emotional well-being.', ARRAY['8 hrs/day — 6 days/week','Medication reminders','Meal assistance','Light exercise support','Doctor appointment coordination','Emergency response trained'], 'elder-companion-daily'),
  (10, 'Nursing Aide — Home', 'elder-care', 1499, 2499, 40, 4.7, 1200, '8 hrs', '/images/elder-care.png', NULL, 'Qualified nursing aide for at-home medical care — wound dressing, physiotherapy support, and health monitoring.', ARRAY['Vital signs monitoring','Wound dressing','Medication administration','Mobility assistance','Health report to family'], 'nursing-aide-home'),
  (11, 'Puja at Home', 'pandit', 2100, 3500, 40, 4.9, 3400, '2-3 hrs', '/images/pandit.png', 'Bestseller', 'Experienced Pandit Ji for home puja ceremonies — Griha Pravesh, Satyanarayan Katha, Navgraha Shanti, and more.', ARRAY['Experienced Pandit Ji','Puja samagri (materials) included','Mantra chanting','Havan setup','Post-puja cleanup','Prasad distribution'], 'puja-at-home'),
  (12, 'Wedding Ceremonies', 'pandit', 11000, 21000, 48, 4.8, 670, 'Full day', '/images/pandit.png', 'Premium', 'Complete wedding ceremony conducted by experienced Pandit Ji. All rituals — Haldi, Mehendi puja, Vivah, and Pheras.', ARRAY['Full-day Pandit Ji','All rituals & mantras','Samagri for all ceremonies','Muhurat consultation','Mandap setup guidance','Post-ceremony blessings'], 'wedding-ceremonies'),
  (13, 'General Physician — Home Visit', 'doctor', 799, 1499, 47, 4.8, 4200, '30 min', '/images/doctor.png', 'Top Rated', 'Qualified general physician visits your home. Full checkup, prescription, and medical advice.', ARRAY['Complete health checkup','Blood pressure & vitals','Digital prescription','Medicine guidance','Follow-up call'], 'general-physician-home'),
  (14, 'Physiotherapist — Home Session', 'doctor', 999, 1799, 44, 4.7, 1800, '45 min', '/images/doctor.png', NULL, 'Certified physiotherapist at home for pain relief, post-surgery rehab, and mobility exercises.', ARRAY['Pain assessment','Therapeutic exercises','Manual therapy','Home exercise plan','Progress tracking'], 'physiotherapist-home'),
  (15, 'Pet Grooming — Dog', 'pet-care', 999, 1799, 44, 4.9, 2780, '1.5 hrs', '/images/pet-care.png', 'Bestseller', 'Full grooming session for your dog — bath, haircut, nail trim, ear cleaning, and more. Professional groomers.', ARRAY['Bath with anti-tick shampoo','Haircut & styling','Nail trimming & filing','Ear cleaning','Teeth brushing','Perfume spray'], 'pet-grooming-dog'),
  (16, 'Dog Walking — Monthly', 'pet-care', 3999, 5999, 33, 4.6, 890, 'Monthly', '/images/pet-care.png', NULL, 'Trained dog walkers for daily morning and evening walks. GPS tracking, photo updates, and reliable handlers.', ARRAY['30 min morning walk','30 min evening walk','GPS tracked route','Photo updates','Poop cleanup'], 'dog-walking-monthly'),
  (17, 'Car Service — Basic', 'mechanic', 2499, 4999, 50, 4.8, 3200, '3-4 hrs', '/images/mechanic.png', 'Top Rated', 'Complete basic car service at your doorstep — oil change, filter replacement, brake check, and general inspection.', ARRAY['Engine oil change','Oil filter replacement','Air filter check','Brake inspection','Battery check','Tire pressure'], 'car-service-basic'),
  (18, 'Bike Service — Full', 'mechanic', 799, 1499, 47, 4.7, 5100, '2 hrs', '/images/mechanic.png', 'Bestseller', 'Full bike service at home — oil change, chain lubrication, brake adjustment, and complete checkup.', ARRAY['Engine oil change','Chain cleaning & lubing','Brake pad check','Spark plug inspection','General wash'], 'bike-service-full'),
  (19, 'Garden Maintenance — Monthly', 'gardener', 3999, 6999, 43, 4.8, 1100, 'Monthly', '/images/gardener.png', 'Premium', 'Professional gardener for monthly maintenance — watering, trimming, weeding, fertilizing, and plant care.', ARRAY['4 visits per month','Watering schedule setup','Pruning & trimming','Weeding & pest check','Fertilizer application','Plant health assessment'], 'garden-maintenance-monthly'),
  (20, 'Lawn Mowing & Cleanup', 'gardener', 599, 999, 40, 4.6, 780, '1.5 hrs', '/images/gardener.png', NULL, 'One-time lawn mowing, edge trimming, leaf removal, and garden cleanup service.', ARRAY['Lawn mowing','Edge trimming','Leaf & debris removal','Hedge shaping','Green waste disposal'], 'lawn-mowing-cleanup'),
  (21, 'Premium Haircut — Men', 'haircut', 299, 599, 50, 4.8, 8900, '30 min', '/images/salon.png', 'Bestseller', 'Professional men''s haircut at home by expert barbers. Includes wash, cut, style, and hot towel finish.', ARRAY['Hair wash with shampoo','Precision haircut','Styling & setting','Hot towel service','Hair serum application'], 'premium-haircut-men'),
  (22, 'Women''s Salon at Home', 'haircut', 999, 1999, 50, 4.9, 5600, '1.5 hrs', '/images/salon.png', 'Top Rated', 'Complete women''s salon service at home — haircut, blow dry, facial, waxing, threading, and more.', ARRAY['Haircut & blow dry','Basic facial','Full arms & legs waxing','Threading — eyebrows & upper lip','Manicure'], 'womens-salon-home'),
  (23, 'Local House Shifting', 'luggage-shifter', 4999, 9999, 50, 4.7, 2100, '4-6 hrs', '/images/luggage-shifter.png', 'Top Rated', 'Complete local house shifting within Greater Noida/Delhi. Packing, loading, transport, unloading, and unpacking.', ARRAY['Packing all items','Loading with care','Transport in covered vehicle','Unloading at new location','Basic unpacking','Furniture assembly'], 'local-house-shifting'),
  (24, 'Intercity Shifting', 'luggage-shifter', 14999, 24999, 40, 4.6, 890, '2-3 days', '/images/luggage-shifter.png', 'Premium', 'Full intercity house shifting — Greater Noida to Delhi NCR and beyond. Insurance included.', ARRAY['Professional packing','Custom crating for fragiles','Insured transport','Unloading & unpacking','Furniture reassembly','Damage protection'], 'intercity-shifting')
ON CONFLICT (id) DO NOTHING;

-- Reset service ID sequence
SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));

-- Professionals
INSERT INTO professionals (id, name, specialty, rating, jobs_count, experience, avatar, tags, is_verified) VALUES
  (1, 'Sunita Devi', 'Cleaning Expert', 4.9, 4200, '6 yrs', '✨', ARRAY['Deep Clean','Bathroom','Kitchen'], true),
  (2, 'Priya Sharma', 'Beauty & Hair Pro', 4.9, 3400, '10 yrs', '✂️', ARRAY['Haircut','Facial','Waxing'], true),
  (3, 'Rajesh Kumar', 'Mechanic Expert', 4.8, 2100, '12 yrs', '🔧', ARRAY['Car Service','Bike','AC Repair'], true),
  (4, 'Dr. Anika Verma', 'General Physician', 4.9, 1800, '8 yrs', '🩺', ARRAY['Checkup','Home Visit','Telehealth'], true),
  (5, 'Pandit Ramesh Ji', 'Puja & Ceremonies', 4.9, 3100, '20 yrs', '🙏', ARRAY['Puja','Havan','Wedding'], true),
  (6, 'Meera Nair', 'Baby & Elder Care', 4.8, 1500, '7 yrs', '👶', ARRAY['Nanny','Elder Care','First Aid'], true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('professionals_id_seq', (SELECT MAX(id) FROM professionals));

-- Testimonials
INSERT INTO testimonials (id, user_name, location, avatar, rating, text, service_name, is_featured, is_approved) VALUES
  (1, 'Ananya Reddy', 'Greater Noida West', '👩', 5, 'Zarpit''s deep cleaning service is absolutely incredible! They cleaned spots I didn''t even know existed. My 3BHK looks brand new now.', 'Deep Cleaning', true, true),
  (2, 'Rohan Mehta', 'Dwarka, Delhi', '👨', 5, 'Booked a Pandit Ji for my Griha Pravesh. Everything was arranged perfectly — puja samagri, havan, the entire ceremony. Very professional!', 'Pandit Ji', true, true),
  (3, 'Kavita Nair', 'Sector 150, Noida', '👩‍💼', 5, 'The nanny from Zarpit is a godsend! She''s so patient with my toddler. CPR trained, background verified — I feel so safe leaving my baby.', 'Baby Care', true, true),
  (4, 'Arjun Singh', 'Connaught Place, Delhi', '🧔', 5, 'Got my car serviced at home — oil change, filter, everything. The mechanic was super professional and the pricing was transparent.', 'Mechanic', true, true),
  (5, 'Neha Gupta', 'Alpha 2, Greater Noida', '👩‍🦱', 5, 'The doctor home visit saved us during an emergency. Dr. Verma arrived within 30 minutes. Quality healthcare at your doorstep!', 'Doctor', true, true),
  (6, 'Vikash Jain', 'Saket, Delhi', '👨‍💻', 5, 'Weekly laundry pickup is a lifesaver. Clothes come back perfectly ironed and packaged. Best ₹399 I spend every week!', 'Laundry', true, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('testimonials_id_seq', (SELECT MAX(id) FROM testimonials));

-- Offers
INSERT INTO offers (id, code, discount_type, discount_value, max_discount, title, description, valid_till) VALUES
  (1, 'ZARPIT50', 'percent', 50, 500, 'First Service Free', 'Get up to 50% off on your first booking with Zarpit. New users in Greater Noida & Delhi only.', '2026-05-31'),
  (2, 'CLEAN300', 'flat', 300, NULL, 'Cleaning Special', 'Flat ₹300 off on all cleaning & laundry services. No minimum order.', '2026-04-30'),
  (3, 'CARE40', 'percent', 40, 400, 'Summer Care Deal', '40% off on babysitting & elder care this summer. Book worry-free!', '2026-06-30'),
  (4, 'REFER500', 'flat', 500, NULL, 'Refer & Earn', 'Refer a friend in Greater Noida or Delhi and both get ₹500 off!', '2026-12-31')
ON CONFLICT (id) DO NOTHING;

SELECT setval('offers_id_seq', (SELECT MAX(id) FROM offers));

-- Service Areas
INSERT INTO service_areas (name, city) VALUES
  ('Greater Noida', 'Greater Noida'),
  ('Greater Noida West (Noida Extension)', 'Greater Noida'),
  ('Sector 150, Noida', 'Noida'),
  ('Alpha, Beta, Gamma, Delta — Greater Noida', 'Greater Noida'),
  ('Pari Chowk, Greater Noida', 'Greater Noida'),
  ('Knowledge Park, Greater Noida', 'Greater Noida'),
  ('New Delhi', 'Delhi'),
  ('South Delhi', 'Delhi'),
  ('Dwarka, Delhi', 'Delhi'),
  ('Connaught Place, Delhi', 'Delhi'),
  ('Saket, Delhi', 'Delhi'),
  ('Vasant Kunj, Delhi', 'Delhi'),
  ('Lajpat Nagar, Delhi', 'Delhi'),
  ('Rohini, Delhi', 'Delhi'),
  ('Janakpuri, Delhi', 'Delhi');

-- Site Settings
INSERT INTO site_settings (key, value, label) VALUES
  ('tax_rate', '5', 'Tax Rate (%)'),
  ('contact_email', 'support@zarpit.com', 'Support Email'),
  ('contact_phone', '1800-ZARPIT', 'Support Phone'),
  ('min_booking_hours', '2', 'Minimum Advance Booking Hours'),
  ('max_booking_days', '30', 'Maximum Advance Booking Days')
ON CONFLICT (key) DO NOTHING;
