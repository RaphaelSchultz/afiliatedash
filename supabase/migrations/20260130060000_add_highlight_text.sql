-- Add custom highlight text column to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS highlight_text text DEFAULT 'Mais Popular';
