-- Tabela de pessoas/cards do organograma
CREATE TABLE public.org_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT 'Comercial',
  avatar_url TEXT,
  position_x FLOAT NOT NULL DEFAULT 100,
  position_y FLOAT NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conexões entre pessoas
CREATE TABLE public.org_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_person_id UUID NOT NULL REFERENCES public.org_people(id) ON DELETE CASCADE,
  to_person_id UUID NOT NULL REFERENCES public.org_people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_person_id, to_person_id)
);

-- Habilitar RLS mas permitir acesso público (sem autenticação por enquanto)
ALTER TABLE public.org_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_connections ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para acesso sem autenticação
CREATE POLICY "Allow public read access on org_people" 
ON public.org_people FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on org_people" 
ON public.org_people FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on org_people" 
ON public.org_people FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on org_people" 
ON public.org_people FOR DELETE USING (true);

CREATE POLICY "Allow public read access on org_connections" 
ON public.org_connections FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on org_connections" 
ON public.org_connections FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access on org_connections" 
ON public.org_connections FOR DELETE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_org_people_updated_at
BEFORE UPDATE ON public.org_people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket para avatares
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Políticas de storage para avatares públicos
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload avatars" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars" 
ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars" 
ON storage.objects FOR DELETE USING (bucket_id = 'avatars');