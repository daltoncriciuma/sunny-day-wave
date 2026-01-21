-- Create table for decorative lines
CREATE TABLE public.org_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_x DOUBLE PRECISION NOT NULL DEFAULT 100,
  start_y DOUBLE PRECISION NOT NULL DEFAULT 100,
  end_x DOUBLE PRECISION NOT NULL DEFAULT 200,
  end_y DOUBLE PRECISION NOT NULL DEFAULT 100,
  color TEXT NOT NULL DEFAULT '#6B7280',
  stroke_width INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_lines ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Public read access on org_lines" ON public.org_lines FOR SELECT USING (true);
CREATE POLICY "Public insert access on org_lines" ON public.org_lines FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on org_lines" ON public.org_lines FOR UPDATE USING (true);
CREATE POLICY "Public delete access on org_lines" ON public.org_lines FOR DELETE USING (true);