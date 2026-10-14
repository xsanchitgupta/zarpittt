-- 1. Careers Table
CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'Engineering', 'Marketing', 'Operations'
  type TEXT NOT NULL,     -- e.g., 'Full-time', 'Part-time'
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL,
  author TEXT DEFAULT 'Zarpit Team',
  category TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Careers: Anyone can read active careers, only service_role (Admin) can insert/update/delete
CREATE POLICY "Public can view active careers" ON careers FOR SELECT USING (is_active = true);

-- Job Applications: Anyone can insert, only service_role (Admin) can select/update/delete
CREATE POLICY "Public can insert job applications" ON job_applications FOR INSERT WITH CHECK (true);

-- Blogs: Anyone can read published blogs, only service_role (Admin) can insert/update/delete
CREATE POLICY "Public can view published blogs" ON blogs FOR SELECT USING (is_published = true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;
