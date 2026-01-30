-- Add offer_id to user_subscriptions to track which specific offer triggered the subscription
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS offer_id TEXT;

-- Comment to explain
COMMENT ON COLUMN user_subscriptions.offer_id IS 'Stores the Kirvano Offer ID that originated this subscription';
