-- Add button_link field to plans table
ALTER TABLE public.plans
ADD COLUMN button_link text DEFAULT NULL;