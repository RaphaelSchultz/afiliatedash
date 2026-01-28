-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create links table
CREATE TABLE public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  pixel_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create link_analytics table
CREATE TABLE public.link_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  device TEXT,
  region TEXT,
  country TEXT,
  channel TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for links table
CREATE POLICY "Users can view own links"
ON public.links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links"
ON public.links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
ON public.links FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
ON public.links FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for link_analytics (via link ownership)
CREATE POLICY "Users can view analytics of own links"
ON public.link_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = link_analytics.link_id
    AND links.user_id = auth.uid()
  )
);

-- Anonymous policy for redirect function to insert analytics
CREATE POLICY "Allow anonymous insert for redirect tracking"
ON public.link_analytics FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous to read links for redirect
CREATE POLICY "Allow anonymous to read active links"
ON public.links FOR SELECT
TO anon
USING (active = true);

-- Create indexes for performance
CREATE INDEX idx_links_slug ON public.links(slug);
CREATE INDEX idx_links_user_id ON public.links(user_id);
CREATE INDEX idx_link_analytics_link_id ON public.link_analytics(link_id);
CREATE INDEX idx_link_analytics_created_at ON public.link_analytics(created_at);

-- Create function to increment click count
CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.links
  SET clicks_count = clicks_count + 1, updated_at = now()
  WHERE slug = link_slug;
END;
$$;

-- Create trigger for links updated_at
CREATE TRIGGER update_links_updated_at
BEFORE UPDATE ON public.links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();