-- =====================================================================
-- ZARPIT — Companion & Helping Buddy categories + services seed
-- Run this in your Supabase Dashboard → SQL Editor
--
-- NOTE: Prices are placeholders (companion services are per hour, per
-- person; buddy services are per task). Adjust them from Admin → Services.
-- Category icons/images can be uploaded from Admin → Categories.
-- =====================================================================

-- 0. Ensure the columns used below exist (no-ops if already added)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS included TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS not_included TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS dos_and_donts JSONB DEFAULT '{"dos": [], "donts": []}'::jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT FALSE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- 1. The two top-level categories
INSERT INTO public.categories (name, slug)
SELECT 'Companion', 'companion'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'companion');

INSERT INTO public.categories (name, slug)
SELECT 'Helping Buddy', 'helping-buddy'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'helping-buddy');

-- 2. Companion sub-services (price = per hour, per person)
DO $$
DECLARE
  v_cat_id public.categories.id%TYPE;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'companion';

  -- 🛍️ Outing Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Outing Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Outing Companion',
      'A friendly, verified companion for casual outings — conversations, activities, navigation and planning, always in public places.',
      199, 'Per Hour', 60, 1,
      '{"dos": ["Meet only at public places.", "Enjoy casual conversations and activities.", "Help with navigation or planning.", "Respect each other''s personal space."],
        "donts": ["No dating or romantic expectations.", "No private room or home visits.", "No physical contact without consent.", "No illegal activities."]}'::jsonb);
  END IF;

  -- 🛒 Shopping Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Shopping Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Shopping Companion',
      'Company for your shopping trips — comparing products and prices, carrying bags, store navigation and honest opinions.',
      199, 'Per Hour', 60, 2,
      '{"dos": ["Help compare products and prices.", "Carry shopping bags if requested.", "Assist with store navigation.", "Give honest opinions when asked."],
        "donts": ["Don''t make purchases using your own money.", "Don''t pressure anyone to buy products.", "Don''t accept expensive gifts.", "No personal financial transactions."]}'::jsonb);
  END IF;

  -- 🎉 Event Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Event Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Event Companion',
      'A respectful companion to attend public events with you — help with seating, navigation and coordination.',
      249, 'Per Hour', 60, 3,
      '{"dos": ["Attend public events together.", "Maintain professional and respectful behavior.", "Help with seating, navigation or coordination.", "Follow event rules."],
        "donts": ["No inappropriate behavior.", "No alcohol or drug abuse.", "Don''t misrepresent your relationship.", "Don''t leave the client without informing them."]}'::jsonb);
  END IF;

  -- 🏥 Medical Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Medical Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Medical Companion',
      'Home-to-hospital travel assistance and support at hospitals or clinics — registration, queues, medicines and reports.',
      249, 'Per Hour', 60, 4,
      '{"dos": ["Home to hospital travel assistance.", "Accompany clients to hospitals or clinics.", "Assist with registration and queues.", "Help collect medicines or reports.", "Stay calm and supportive."],
        "donts": ["Don''t give medical advice.", "Don''t administer medicines or injections.", "Don''t make medical decisions.", "Don''t access confidential records without permission."]}'::jsonb);
  END IF;

  -- 👴 Senior Citizen Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Senior Citizen Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Senior Citizen Companion',
      'Friendly conversation, emotional support and daily-outing assistance for senior citizens, with patience and respect.',
      199, 'Per Hour', 60, 5,
      '{"dos": ["Offer friendly conversation and emotional support.", "Assist with walking and daily outings.", "Help with simple non-medical tasks.", "Be patient and respectful."],
        "donts": ["Don''t handle money without permission.", "Don''t influence legal or financial decisions.", "Don''t leave the senior unattended if responsible.", "Don''t misuse personal information."]}'::jsonb);
  END IF;

  -- 🎬 Movie Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Movie Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Movie Companion',
      'Someone to watch a movie with — meet at the theatre, enjoy the film and friendly conversation.',
      199, 'Per Hour', 60, 6,
      '{"dos": ["Meet at the theatre.", "Watch the movie respectfully.", "Maintain friendly conversation.", "Respect personal boundaries."],
        "donts": ["No romantic expectations.", "No inappropriate physical contact.", "Don''t force post-movie plans.", "No harassment."]}'::jsonb);
  END IF;

  -- ⏳ Waiting Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Waiting Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Waiting Companion',
      'Waits at your assigned location on your behalf and keeps you updated throughout.',
      149, 'Per Hour', 60, 7,
      '{"dos": ["Wait at the assigned location.", "Keep the client updated.", "Follow instructions carefully.", "Respect scheduled timings."],
        "donts": ["Don''t leave without informing the client.", "Don''t misuse documents or belongings.", "Don''t impersonate the client.", "Don''t violate venue rules."]}'::jsonb);
  END IF;

  -- 🛕 Temple Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Temple Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Temple Companion',
      'Respectful company for temple visits — assistance for elderly or disabled visitors while honouring religious customs.',
      199, 'Per Hour', 60, 8,
      '{"dos": ["Respect religious customs.", "Help elderly or disabled visitors.", "Maintain silence where required.", "Dress appropriately."],
        "donts": ["Don''t disrespect religious beliefs.", "Don''t argue about religion.", "Don''t accept donations on behalf of others.", "Don''t break temple rules."]}'::jsonb);
  END IF;

  -- 🚶 Walking & Fitness Companion
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Walking & Fitness Companion') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, dos_and_donts)
    VALUES (v_cat_id, 'Walking & Fitness Companion',
      'A motivating walk and fitness partner — comfortable pace, healthy habits, safe public areas.',
      149, 'Per Hour', 60, 9,
      '{"dos": ["Walk at a comfortable pace.", "Encourage healthy habits.", "Stay in safe public areas.", "Respect the client''s fitness level."],
        "donts": ["Don''t provide medical or fitness treatment.", "Don''t force difficult exercises.", "Don''t leave the client midway.", "Don''t ignore safety concerns."]}'::jsonb);
  END IF;
END $$;

-- 3. Helping Buddy sub-services (price = per task)
DO $$
DECLARE
  v_cat_id public.categories.id%TYPE;
BEGIN
  SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'helping-buddy';

  -- 👤 Personal Task Buddy
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Personal Task Buddy') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, included, dos_and_donts)
    VALUES (v_cat_id, 'Personal Task Buddy',
      'Need help with small everyday errands? A Personal Task Buddy can pick up items, get documents printed or collected, deliver small items within the city, submit forms and run urgent local errands. Standard service available within 5–7 km; additional distance charges may apply beyond the service radius.',
      149, 'Per Task', 60, 1,
      ARRAY['Picking up items from a specific shop or food stall', 'Getting documents printed, photocopied, or collected', 'Delivering or picking up small items within the city', 'Submitting or collecting forms', 'Running urgent local errands'],
      '{"dos": ["Clearly explain the task before booking.", "Share accurate pickup and drop details.", "Keep required documents ready.", "Use the service only for legal and safe tasks."],
        "donts": ["No transportation of illegal, restricted, or hazardous items.", "No handling of large valuables, cash, gold, or confidential items without approval.", "No personal banking transactions.", "Buddies will not use their own money unless agreed through platform guidelines."]}'::jsonb);
  END IF;

  -- ✈️ Airport & Station Buddy
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Airport & Station Buddy') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, included, dos_and_donts)
    VALUES (v_cat_id, 'Airport & Station Buddy',
      'Traveling with heavy luggage or need assistance getting to the airport or station? A Buddy accompanies you from home, helps with luggage, guides you through entry points and helps coordinate pickups and drop-offs.',
      299, 'Per Task', 120, 2,
      ARRAY['Accompany you from home to the airport/station', 'Assist with luggage handling', 'Help senior citizens, families, and first-time travelers', 'Guide you through entry points and waiting areas', 'Help coordinate pickups and drop-offs'],
      '{"dos": ["Keep tickets and ID documents with yourself.", "Inform the Buddy about luggage requirements in advance.", "Reach on time for smooth travel assistance.", "Follow airport and railway rules."],
        "donts": ["Buddies do not carry or transport prohibited items.", "Buddies do not check in using your ID.", "Buddies do not take responsibility for lost valuables.", "Buddies are assistants, not licensed porters or travel agents."]}'::jsonb);
  END IF;

  -- 📦 Shifting & Moving Buddy
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Shifting & Moving Buddy') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, included, dos_and_donts)
    VALUES (v_cat_id, 'Shifting & Moving Buddy',
      'Perfect for students, hostel residents, PG tenants, and families who need an extra helping hand while moving — packing, loading, unloading and arranging.',
      349, 'Per Task', 180, 3,
      ARRAY['Help organize and pack belongings', 'Assist in moving items from one room or location to another', 'Help load and unload household items', 'Support with arranging furniture and boxes', 'Make shifting easier and more organized'],
      '{"dos": ["Inform us about the type and quantity of items.", "Book multiple Buddies if heavy assistance is required.", "Keep fragile items clearly marked.", "Supervise valuable belongings during shifting."],
        "donts": ["Buddies do not provide transportation vehicles.", "Buddies do not bring packing materials unless specifically arranged.", "Buddies are not responsible for improperly packed fragile items.", "No movement of illegal, dangerous, or restricted goods."]}'::jsonb);
  END IF;

  -- 🏠 Home Helper
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Home Helper') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, included, dos_and_donts)
    VALUES (v_cat_id, 'Home Helper',
      'Sometimes you just need an extra pair of hands — curtains, festival decorations, organizing rooms, moving furniture within the house, receiving deliveries and general household assistance.',
      199, 'Per Task', 120, 4,
      ARRAY['Hanging curtains', 'Festival decorations and lighting setup', 'Organizing rooms and cupboards', 'Moving furniture within the house', 'Receiving deliveries', 'General household assistance', 'Simple non-technical support tasks'],
      '{"dos": ["Clearly explain the work required.", "Ensure a safe working environment.", "Provide necessary tools if the task requires them.", "Treat Buddies with respect."],
        "donts": ["No electrical, plumbing, or technical repair work unless booked under the relevant category.", "No unsafe rooftop or high-risk work.", "No handling of confidential documents or valuables.", "No tasks involving illegal activities."]}'::jsonb);
  END IF;

  -- ⏳ Queue & Waiting Buddy
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Queue & Waiting Buddy') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, included, dos_and_donts)
    VALUES (v_cat_id, 'Queue & Waiting Buddy',
      'Don''t have time to wait? A Queue & Waiting Buddy can stand in queues, wait at assigned locations, collect tokens where permitted, receive deliveries, or wait for someone on your behalf — keeping you updated throughout.',
      149, 'Per Task', 120, 5,
      ARRAY['Stand in queues on your behalf', 'Wait at assigned locations', 'Collect tokens where permitted', 'Receive deliveries', 'Wait for someone on your behalf'],
      '{"dos": ["Clearly mention the waiting location and purpose.", "Share all required details before the task starts.", "Stay reachable in case the Buddy needs your confirmation.", "Inform the Buddy immediately if your plan changes."],
        "donts": ["Don''t book for places where proxy waiting is not allowed.", "Don''t ask the Buddy to misuse IDs, tickets, or official documents.", "Don''t request illegal or fraudulent activities.", "Don''t ask the Buddy to leave the queue without your confirmation."]}'::jsonb);
  END IF;

  -- 🎪 Event Assistance
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Event Assistance') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, included, dos_and_donts)
    VALUES (v_cat_id, 'Event Assistance',
      'Need an extra helping hand at an event? An Event Assistance Buddy can help with guest coordination, registrations, seating arrangements, basic setup, backstage support and other non-technical event tasks for weddings, parties, corporate events, exhibitions, and private functions.',
      299, 'Per Task', 240, 6,
      ARRAY['Guest coordination', 'Registrations', 'Seating arrangements', 'Basic setup', 'Backstage support', 'Other non-technical event tasks'],
      '{"dos": ["Clearly explain the Buddy''s responsibilities before the event.", "Share event timing, venue, and dress code (if any).", "Assign only safe and legal tasks.", "Treat the Buddy with respect and professionalism."],
        "donts": ["Don''t assign security or licensed professional duties.", "Don''t ask the Buddy to handle large amounts of cash or valuables.", "Don''t request unsafe or inappropriate tasks.", "Don''t force the Buddy to work beyond the booked duration without extending the booking."]}'::jsonb);
  END IF;

  -- 📝 Custom Task Request
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category_id = v_cat_id AND name = 'Custom Task Request') THEN
    INSERT INTO public.services (category_id, name, description, price, duration, duration_minutes, sort_order, included, dos_and_donts)
    VALUES (v_cat_id, 'Custom Task Request',
      'Can''t find the service you need? Create a Custom Task Request by describing your requirement. If it''s safe, legal, and within the Buddy''s capabilities, we''ll match you with the right person to help.',
      199, 'Per Task', 60, 7,
      ARRAY['Describe your task clearly with complete details', 'Mention the location, expected duration, and special requirements', 'We match you with the right Buddy for the job'],
      '{"dos": ["Describe your task clearly with complete details.", "Mention the location, expected duration, and special requirements.", "Book only legal, safe, and reasonable tasks.", "Be available for clarification if required."],
        "donts": ["Don''t request illegal, unethical, or unsafe activities.", "Don''t request licensed professional work (medical, legal, electrical, plumbing, etc.) under this category.", "Don''t ask the Buddy to spend personal money unless pre-approved through the platform.", "Don''t request transportation of illegal, hazardous, or high-value items."]}'::jsonb);
  END IF;
END $$;

-- 4. Verify
-- SELECT c.name AS category, s.name, s.price, s.duration FROM services s JOIN categories c ON c.id = s.category_id WHERE c.slug IN ('companion','helping-buddy') ORDER BY c.slug, s.sort_order;
