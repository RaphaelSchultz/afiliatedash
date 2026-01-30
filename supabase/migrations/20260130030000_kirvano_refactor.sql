-- 1. Add 'kirvano_offer_id' to the plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS kirvano_offer_id text;

-- 2. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_plans_kirvano_offer_id ON plans(kirvano_offer_id);

-- 3. Create RPC function to get user ID by email (Security/Performance)
-- This avoids using supabase.auth.admin.listUsers() which is slow and heavy
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input text)
RETURNS table (id uuid)
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  RETURN QUERY SELECT u.id FROM auth.users u WHERE u.email = email_input;
END;
$$ LANGUAGE plpgsql;
