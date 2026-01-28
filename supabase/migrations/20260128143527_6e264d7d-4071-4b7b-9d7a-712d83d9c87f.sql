-- =====================================================
-- SECURITY: Add explicit policies to deny anonymous access
-- This ensures anon role cannot access any sensitive data
-- =====================================================

-- Deny anonymous SELECT on profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on profiles
CREATE POLICY "Deny anonymous insert on profiles"
ON public.profiles FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous UPDATE on profiles
CREATE POLICY "Deny anonymous update on profiles"
ON public.profiles FOR UPDATE
TO anon
USING (false);

-- Deny anonymous SELECT on shopee_credentials
CREATE POLICY "Deny anonymous access to credentials"
ON public.shopee_credentials FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on shopee_credentials
CREATE POLICY "Deny anonymous insert on credentials"
ON public.shopee_credentials FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous SELECT on shopee_vendas
CREATE POLICY "Deny anonymous access to vendas"
ON public.shopee_vendas FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on shopee_vendas
CREATE POLICY "Deny anonymous insert on vendas"
ON public.shopee_vendas FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous SELECT on shopee_clicks
CREATE POLICY "Deny anonymous access to clicks"
ON public.shopee_clicks FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on shopee_clicks
CREATE POLICY "Deny anonymous insert on clicks"
ON public.shopee_clicks FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous SELECT on shopee_settlements
CREATE POLICY "Deny anonymous access to settlements"
ON public.shopee_settlements FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on shopee_settlements
CREATE POLICY "Deny anonymous insert on settlements"
ON public.shopee_settlements FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous SELECT on investments_manual
CREATE POLICY "Deny anonymous access to investments"
ON public.investments_manual FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on investments_manual
CREATE POLICY "Deny anonymous insert on investments"
ON public.investments_manual FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous SELECT on user_subscriptions
CREATE POLICY "Deny anonymous access to subscriptions"
ON public.user_subscriptions FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on user_subscriptions
CREATE POLICY "Deny anonymous insert on subscriptions"
ON public.user_subscriptions FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous SELECT on upload_history
CREATE POLICY "Deny anonymous access to upload_history"
ON public.upload_history FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on upload_history
CREATE POLICY "Deny anonymous insert on upload_history"
ON public.upload_history FOR INSERT
TO anon
WITH CHECK (false);

-- Ensure shopee_sync_control has explicit SELECT denial for all roles
CREATE POLICY "Deny all select on sync_control"
ON public.shopee_sync_control FOR SELECT
USING (false);

-- Revoke all table permissions from anon role for extra security
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.shopee_credentials FROM anon;
REVOKE ALL ON public.shopee_vendas FROM anon;
REVOKE ALL ON public.shopee_clicks FROM anon;
REVOKE ALL ON public.shopee_settlements FROM anon;
REVOKE ALL ON public.investments_manual FROM anon;
REVOKE ALL ON public.user_subscriptions FROM anon;
REVOKE ALL ON public.upload_history FROM anon;
REVOKE ALL ON public.shopee_sync_control FROM anon;