-- Primeiro, remover as políticas existentes problemáticas
DROP POLICY IF EXISTS "Users can CRUD own credentials" ON public.shopee_credentials;
DROP POLICY IF EXISTS "Users view own credentials" ON public.shopee_credentials;

-- Criar políticas PERMISSIVAS corretas para cada operação
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

-- Também corrigir shopee_settlements que está sem políticas RLS
ALTER TABLE public.shopee_settlements ENABLE ROW LEVEL SECURITY;

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