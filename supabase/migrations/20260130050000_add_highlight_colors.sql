-- Add custom highlight color columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS highlight_text_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS highlight_bg_color text DEFAULT '#f97316', -- Default orange-500
ADD COLUMN IF NOT EXISTS highlight_border_color text DEFAULT '#f97316'; -- Default orange-500
