-- Corrigir permissões para role anon (necessário para chamadas RPC)
-- e garantir que authenticated tenha acesso completo

-- Restaurar permissões necessárias para anon em funções RPC
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Shopee Vendas - precisa de acesso para o frontend funcionar
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_vendas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_vendas TO authenticated;

-- Shopee Clicks
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_clicks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_clicks TO authenticated;

-- Shopee Credentials
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_credentials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_credentials TO authenticated;

-- Shopee Settlements
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_settlements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_settlements TO authenticated;

-- Investments Manual
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments_manual TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments_manual TO authenticated;

-- User Subscriptions
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;

-- Upload History
GRANT SELECT, INSERT ON public.upload_history TO anon;
GRANT SELECT, INSERT ON public.upload_history TO authenticated;

-- Shopee Sync Control (somente para funções do sistema)
GRANT SELECT, INSERT, UPDATE ON public.shopee_sync_control TO authenticated;

-- Garantir que as funções RPC funcionem corretamente
GRANT EXECUTE ON FUNCTION public.get_relatorio_financeiro_br(timestamp with time zone, timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.get_relatorio_financeiro_br(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relatorio_financeiro_br_simple(timestamp with time zone, timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.get_relatorio_financeiro_br_simple(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relatorio_comissoes(timestamp with time zone, timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.get_relatorio_comissoes(timestamp with time zone, timestamp with time zone) TO authenticated;