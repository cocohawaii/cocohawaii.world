-- ============================================
-- COCO HAWAII - Help Tickets System
-- Run in Supabase SQL Editor
-- ============================================

-- 1. HELP_TICKETS
CREATE TABLE IF NOT EXISTS public.help_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  unread_by_admin BOOLEAN NOT NULL DEFAULT true,
  unread_by_user BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_help_tickets_member ON public.help_tickets(member_id);
CREATE INDEX idx_help_tickets_email ON public.help_tickets(email);
CREATE INDEX idx_help_tickets_status ON public.help_tickets(status);
CREATE INDEX idx_help_tickets_last_message ON public.help_tickets(last_message_at DESC);
CREATE INDEX idx_help_tickets_unread_admin ON public.help_tickets(unread_by_admin) WHERE unread_by_admin = true;

-- 2. HELP_TICKET_MESSAGES
CREATE TABLE IF NOT EXISTS public.help_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.help_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_help_ticket_messages_ticket ON public.help_ticket_messages(ticket_id);

-- RLS
ALTER TABLE public.help_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own tickets (by member_id)
CREATE POLICY "Users can read own tickets"
  ON public.help_tickets FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
  );

-- Authenticated users can create tickets for themselves
CREATE POLICY "Users can create own tickets"
  ON public.help_tickets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (member_id IS NULL OR member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid()))
  );

-- Users can update their own tickets (limited - e.g. for status)
CREATE POLICY "Users can update own tickets"
  ON public.help_tickets FOR UPDATE
  USING (
    member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
  );

-- Admins can do everything on tickets
CREATE POLICY "Admins can manage tickets"
  ON public.help_tickets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
  );

-- Messages: users can read messages for their tickets
CREATE POLICY "Users can read own ticket messages"
  ON public.help_ticket_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.help_tickets
      WHERE member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- Users can insert messages for their tickets
CREATE POLICY "Users can add messages to own tickets"
  ON public.help_ticket_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.help_tickets
      WHERE member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- Admins can do everything on messages
CREATE POLICY "Admins can manage messages"
  ON public.help_ticket_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
  );

-- Grant
GRANT SELECT, INSERT, UPDATE ON public.help_tickets TO authenticated;
GRANT SELECT, INSERT ON public.help_ticket_messages TO authenticated;
