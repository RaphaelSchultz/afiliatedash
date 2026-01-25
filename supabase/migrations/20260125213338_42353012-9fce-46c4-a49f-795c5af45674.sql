-- =============================================
-- CORREÇÃO DE SEGURANÇA: shopee_settlements
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can insert own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can update own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can delete own settlements" ON public.shopee_settlements;

-- Criar políticas PERMISSIVE completas
CREATE POLICY "Users can view own settlements"
ON public.shopee_settlements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settlements"
ON public.shopee_settlements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settlements"
ON public.shopee_settlements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settlements"
ON public.shopee_settlements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revogar acesso anônimo
REVOKE ALL ON public.shopee_settlements FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_settlements TO authenticated;

-- =============================================
-- CORREÇÃO DE SEGURANÇA: investments_manual
-- =============================================

-- Remover política existente
DROP POLICY IF EXISTS "Users can manage own investments" ON public.investments_manual;

-- Criar políticas PERMISSIVE separadas por operação
CREATE POLICY "Users can view own investments"
ON public.investments_manual
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
ON public.investments_manual
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
ON public.investments_manual
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
ON public.investments_manual
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revogar acesso anônimo
REVOKE ALL ON public.investments_manual FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments_manual TO authenticated;