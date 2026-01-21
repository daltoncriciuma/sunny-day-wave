-- Add fill_card column to org_people table for full card color option
ALTER TABLE public.org_people 
ADD COLUMN fill_card boolean NOT NULL DEFAULT false;