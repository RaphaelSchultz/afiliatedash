-- =============================================
-- CORREÇÃO DE SEGURANÇA: shopee_vendas
-- =============================================

-- Remover políticas existentes (RESTRICTIVE)
DROP POLICY IF EXISTS "Users can view own sales" ON public.shopee_vendas;
DROP POLICY IF EXISTS "Users view own vendas" ON public.shopee_vendas;

-- Criar política PERMISSIVE para SELECT - apenas usuários autenticados veem seus próprios dados
CREATE POLICY "Users can view own sales"
ON public.shopee_vendas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Criar política para INSERT - usuários só inserem seus próprios dados
CREATE POLICY "Users can insert own sales"
ON public.shopee_vendas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Criar política para UPDATE - usuários só atualizam seus próprios dados
CREATE POLICY "Users can update own sales"
ON public.shopee_vendas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar política para DELETE - usuários só deletam seus próprios dados
CREATE POLICY "Users can delete own sales"
ON public.shopee_vendas
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revogar acesso anônimo explicitamente
REVOKE ALL ON public.shopee_vendas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_vendas TO authenticated;

-- =============================================
-- CORREÇÃO DE SEGURANÇA: shopee_credentials
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own credentials" ON public.shopee_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.shopee_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.shopee_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.shopee_credentials;

-- Criar políticas PERMISSIVE - apenas autenticados acessam seus dados
CREATE POLICY "Users can view own credentials"
ON public.shopee_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
ON public.shopee_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
ON public.shopee_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
ON public.shopee_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revogar acesso anônimo explicitamente
REVOKE ALL ON public.shopee_credentials FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_credentials TO authenticated;