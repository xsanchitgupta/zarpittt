-- =============================================
-- ZARPIT — Task Assignment Engine & Dos/Donts
-- Run this in your Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Add dos_and_donts to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS dos_and_donts JSONB DEFAULT '{"dos": [], "donts": []}'::jsonb;

-- 2. Create Task Assignments Table
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  worker_type TEXT NOT NULL CHECK (worker_type IN ('salaried', 'commission')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  estimated_start TIMESTAMPTZ NOT NULL,
  estimated_end TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_worker ON public.task_assignments(worker_id, status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_booking ON public.task_assignments(booking_id);

-- Enable RLS
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage task assignments" ON public.task_assignments
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Workers can view their own assignments
CREATE POLICY "Workers can view own assignments" ON public.task_assignments
  FOR SELECT USING (auth.uid() = worker_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignments;

-- 3. Automatic Assignment Function
CREATE OR REPLACE FUNCTION public.auto_assign_salaried_worker(
  p_booking_id UUID, 
  p_scheduled_start TIMESTAMPTZ,
  p_duration_minutes INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_worker RECORD;
  v_end_time TIMESTAMPTZ;
  v_working_hour_start TIME := '09:00:00';
  v_working_hour_end TIME := '20:00:00';
BEGIN
  -- Calculate end time with buffer
  v_end_time := p_scheduled_start + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Check if outside working hours (using IST time zone)
  IF (p_scheduled_start AT TIME ZONE 'Asia/Kolkata')::TIME < v_working_hour_start OR (v_end_time AT TIME ZONE 'Asia/Kolkata')::TIME > v_working_hour_end THEN
    RETURN json_build_object('success', false, 'reason', 'outside_working_hours');
  END IF;

  -- Idempotency check
  IF EXISTS (SELECT 1 FROM public.task_assignments 
             WHERE booking_id = p_booking_id 
             AND status IN ('assigned', 'in_progress')) THEN
    RETURN json_build_object('success', false, 'reason', 'already_assigned');
  END IF;
  
  -- Find the best available salaried worker:
  -- 1. Must be approved
  -- 2. Must NOT have an overlapping task in the time window
  -- 3. Prefer the worker whose last task ended earliest (fairness)
  SELECT pp.user_id INTO v_worker
  FROM public.provider_profiles pp
  WHERE pp.worker_type = 'salaried'
    AND pp.verification_status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.task_assignments ta
      WHERE ta.worker_id = pp.user_id
        AND ta.status IN ('assigned', 'in_progress')
        AND ta.estimated_start < v_end_time
        AND ta.estimated_end > p_scheduled_start
    )
  ORDER BY (
    SELECT COALESCE(MAX(ta2.estimated_end), '1970-01-01'::timestamptz)
    FROM public.task_assignments ta2
    WHERE ta2.worker_id = pp.user_id AND ta2.status IN ('assigned', 'in_progress', 'completed')
  ) ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF v_worker IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'no_available_worker');
  END IF;
  
  -- Atomic insert
  INSERT INTO public.task_assignments (booking_id, worker_id, worker_type, estimated_start, estimated_end, status)
  VALUES (p_booking_id, v_worker.user_id, 'salaried', p_scheduled_start, v_end_time, 'assigned');
  
  -- Update booking
  UPDATE public.bookings 
  SET professional_id = v_worker.user_id, status = 'confirmed' 
  WHERE id = p_booking_id;
  
  RETURN json_build_object('success', true, 'worker_id', v_worker.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
