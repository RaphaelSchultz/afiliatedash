-- Add slug column to plans table
ALTER TABLE plans ADD COLUMN slug TEXT;

-- Make it unique (initially nullable to allow backfill, then enforce unique/not null)
ALTER TABLE plans ADD CONSTRAINT plans_slug_key UNIQUE (slug);

-- Backfill typically would be manual or inferred, let's try to infer manageable defaults
-- Note: This is a best-effort backfill based on name patterns
UPDATE plans 
SET slug = 
  CASE 
    WHEN lower(name) LIKE '%free%' OR lower(name) LIKE '%básico%' THEN 'basic'
    WHEN lower(name) LIKE '%intermediário%' OR lower(name) LIKE '%mensal%' THEN 'intermediate'
    WHEN lower(name) LIKE '%pro%' OR lower(name) LIKE '%premium%' OR lower(name) LIKE '%anual%' THEN 'pro'
    ELSE 'plan-' || id -- Fallback
  END
WHERE slug IS NULL;

-- Now enforce NOT NULL
ALTER TABLE plans ALTER COLUMN slug SET NOT NULL;
