-- Run this in Supabase SQL Editor to create page analytics tables
-- Copy all, paste into SQL Editor, click Run

CREATE TABLE IF NOT EXISTS public.page_analytics_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page, visitor_id)
);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visits_page ON public.page_analytics_visits(page);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visits_visitor ON public.page_analytics_visits(visitor_id);

CREATE TABLE IF NOT EXISTS public.page_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'login')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_analytics_events_type ON public.page_analytics_events(event_type);

ALTER TABLE public.page_analytics_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_analytics_events ENABLE ROW LEVEL SECURITY;
