-- Add new columns for detailed payment info
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS checkout_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Update RLS policies (optional, usually inferred, but good practice to ensure)
-- Assuming the existing policy covers updates/inserts
