-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public read access on org_people" ON public.org_people;
DROP POLICY IF EXISTS "Allow public insert access on org_people" ON public.org_people;
DROP POLICY IF EXISTS "Allow public update access on org_people" ON public.org_people;
DROP POLICY IF EXISTS "Allow public delete access on org_people" ON public.org_people;

DROP POLICY IF EXISTS "Allow public read access on org_connections" ON public.org_connections;
DROP POLICY IF EXISTS "Allow public insert access on org_connections" ON public.org_connections;
DROP POLICY IF EXISTS "Allow public delete access on org_connections" ON public.org_connections;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Public read access on org_people" 
ON public.org_people FOR SELECT 
USING (true);

CREATE POLICY "Public insert access on org_people" 
ON public.org_people FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access on org_people" 
ON public.org_people FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access on org_people" 
ON public.org_people FOR DELETE 
USING (true);

CREATE POLICY "Public read access on org_connections" 
ON public.org_connections FOR SELECT 
USING (true);

CREATE POLICY "Public insert access on org_connections" 
ON public.org_connections FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access on org_connections" 
ON public.org_connections FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access on org_connections" 
ON public.org_connections FOR DELETE 
USING (true);