-- Add card_size column to org_people table
ALTER TABLE public.org_people 
ADD COLUMN card_size text NOT NULL DEFAULT 'medium';

-- Add constraint to ensure valid values
ALTER TABLE public.org_people 
ADD CONSTRAINT org_people_card_size_check 
CHECK (card_size IN ('small', 'medium', 'large'));