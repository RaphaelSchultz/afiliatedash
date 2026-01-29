-- Add columns to user_subscriptions for Kirvano integration
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS last_event_payload JSONB;

-- Add index for faster lookups by external_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_external_id ON public.user_subscriptions(external_id);

-- Add comment for documentation
COMMENT ON COLUMN public.user_subscriptions.external_id IS 'External subscription ID from payment provider (Kirvano)';
COMMENT ON COLUMN public.user_subscriptions.last_event_payload IS 'Last webhook payload received for audit purposes';