-- Add locked column to org_people table
ALTER TABLE public.org_people ADD COLUMN locked boolean NOT NULL DEFAULT false;