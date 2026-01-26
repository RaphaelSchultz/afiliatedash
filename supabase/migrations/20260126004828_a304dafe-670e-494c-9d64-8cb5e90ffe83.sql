-- =====================================================
-- SECURITY HARDENING: Explicit denial for anonymous access
-- =====================================================

-- Revoke all permissions from anon role on sensitive tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.shopee_vendas FROM anon;
REVOKE ALL ON public.shopee_clicks FROM anon;
REVOKE ALL ON public.shopee_credentials FROM anon;
REVOKE ALL ON public.shopee_settlements FROM anon;
REVOKE ALL ON public.investments_manual FROM anon;
REVOKE ALL ON public.user_subscriptions FROM anon;
REVOKE ALL ON public.upload_history FROM anon;

-- Grant only to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_vendas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_clicks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_settlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments_manual TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.upload_history TO authenticated;

-- =====================================================
-- Fix RESTRICTIVE policies - change to PERMISSIVE
-- (RESTRICTIVE policies can block all access unintentionally)
-- =====================================================

-- PROFILES: Drop restrictive and recreate as permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- SHOPEE_VENDAS: Drop restrictive and recreate as permissive
DROP POLICY IF EXISTS "Users can view own sales" ON public.shopee_vendas;
DROP POLICY IF EXISTS "Users can insert own sales" ON public.shopee_vendas;
DROP POLICY IF EXISTS "Users can update own sales" ON public.shopee_vendas;
DROP POLICY IF EXISTS "Users can delete own sales" ON public.shopee_vendas;

CREATE POLICY "Users can view own sales" 
  ON public.shopee_vendas FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales" 
  ON public.shopee_vendas FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales" 
  ON public.shopee_vendas FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales" 
  ON public.shopee_vendas FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- SHOPEE_CLICKS: Drop and recreate
DROP POLICY IF EXISTS "Usuários veem apenas seus próprios cliques" ON public.shopee_clicks;
DROP POLICY IF EXISTS "Users view own clicks" ON public.shopee_clicks;

CREATE POLICY "Users can view own clicks" 
  ON public.shopee_clicks FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clicks" 
  ON public.shopee_clicks FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clicks" 
  ON public.shopee_clicks FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clicks" 
  ON public.shopee_clicks FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- SHOPEE_CREDENTIALS: Drop restrictive and recreate
DROP POLICY IF EXISTS "Users can view own credentials" ON public.shopee_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.shopee_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.shopee_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.shopee_credentials;

CREATE POLICY "Users can view own credentials" 
  ON public.shopee_credentials FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" 
  ON public.shopee_credentials FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" 
  ON public.shopee_credentials FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials" 
  ON public.shopee_credentials FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- SHOPEE_SETTLEMENTS: Drop restrictive and recreate
DROP POLICY IF EXISTS "Users can view own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can insert own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can update own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can delete own settlements" ON public.shopee_settlements;

CREATE POLICY "Users can view own settlements" 
  ON public.shopee_settlements FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settlements" 
  ON public.shopee_settlements FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settlements" 
  ON public.shopee_settlements FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settlements" 
  ON public.shopee_settlements FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- INVESTMENTS_MANUAL: Drop restrictive and recreate
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments_manual;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments_manual;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments_manual;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments_manual;

CREATE POLICY "Users can view own investments" 
  ON public.investments_manual FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" 
  ON public.investments_manual FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" 
  ON public.investments_manual FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" 
  ON public.investments_manual FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- USER_SUBSCRIPTIONS: Drop restrictive and recreate
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscription" 
  ON public.user_subscriptions FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" 
  ON public.user_subscriptions FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" 
  ON public.user_subscriptions FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPLOAD_HISTORY: Drop restrictive and recreate
DROP POLICY IF EXISTS "Users can view own upload history" ON public.upload_history;
DROP POLICY IF EXISTS "Users can insert own upload history" ON public.upload_history;

CREATE POLICY "Users can view own upload history" 
  ON public.upload_history FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload history" 
  ON public.upload_history FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);