-- Create sectors table
CREATE TABLE public.org_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_sectors ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for public access
CREATE POLICY "Public read access on org_sectors" 
ON public.org_sectors FOR SELECT 
USING (true);

CREATE POLICY "Public insert access on org_sectors" 
ON public.org_sectors FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access on org_sectors" 
ON public.org_sectors FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access on org_sectors" 
ON public.org_sectors FOR DELETE 
USING (true);

-- Add sector_id to org_people (nullable to not break existing cards)
ALTER TABLE public.org_people 
ADD COLUMN sector_id UUID REFERENCES public.org_sectors(id) ON DELETE SET NULL;