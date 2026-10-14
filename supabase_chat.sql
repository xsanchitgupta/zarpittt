-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies in case we are replacing them
DROP POLICY IF EXISTS "Users can read their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;

-- Policies
-- 1. Users can read messages for bookings they own, or bookings assigned to them.
CREATE POLICY "Users can read their own chat messages"
ON public.chat_messages
FOR SELECT  
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = chat_messages.booking_id
    AND (
      b.user_id = auth.uid() OR
      b.professional_id = auth.uid()
    )
  )
);

-- 2. Users can insert messages for bookings they own, or bookings assigned to them.
CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND 
      b.user_id = auth.uid() OR
      b.professional_id = auth.uid()
    )
  )
);


