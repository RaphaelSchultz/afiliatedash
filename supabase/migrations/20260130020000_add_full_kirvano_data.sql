-- Add a JSONB column to store the complete raw payload from Kirvano
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS kirvano_payload JSONB;

-- Comment to explain the column usage
COMMENT ON COLUMN user_subscriptions.kirvano_payload IS 'Stores the complete raw webhook payload received from Kirvano for the last event';
