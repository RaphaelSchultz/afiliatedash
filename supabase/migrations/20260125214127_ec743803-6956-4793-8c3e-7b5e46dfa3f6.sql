-- =============================================
-- CORREÇÃO: shopee_sync_control - Adicionar RLS
-- =============================================
-- Habilitar RLS na tabela
ALTER TABLE public.shopee_sync_control ENABLE ROW LEVEL SECURITY;

-- Criar política que nega todo acesso (tabela de controle interno)
-- Apenas service_role pode acessar (não precisa de política)
CREATE POLICY "Deny all access to sync control"
ON public.shopee_sync_control
FOR ALL
TO authenticated, anon
USING (false);

-- Garantir que anon e authenticated não tenham acesso direto
REVOKE ALL ON public.shopee_sync_control FROM anon;
REVOKE ALL ON public.shopee_sync_control FROM authenticated;