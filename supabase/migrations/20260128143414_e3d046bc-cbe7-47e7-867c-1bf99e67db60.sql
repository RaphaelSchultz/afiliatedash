-- =====================================================
-- SECURITY FIX: Set search_path on all database functions
-- This prevents search path hijacking attacks
-- =====================================================

-- Fix get_relatorio_financeiro_br_simple (currently missing search_path)
CREATE OR REPLACE FUNCTION public.get_relatorio_financeiro_br_simple(data_inicio timestamp with time zone, data_fim timestamp with time zone)
 RETURNS TABLE(data_pedido text, qtd_vendas bigint, comissao_liquida numeric, comissao_bruta numeric)
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path = public
AS $function$
  WITH unique_orders AS (
    SELECT DISTINCT ON (order_id)
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      order_id,
      actual_amount::numeric as amount,
      net_commission::numeric as commission
    FROM shopee_vendas
    WHERE purchase_time >= data_inicio 
      AND purchase_time <= data_fim
      AND order_status IN ('COMPLETED', 'PENDING')
    ORDER BY order_id, purchase_time DESC
  )
  SELECT 
    data_d as data_pedido,
    COUNT(*) as qtd_vendas,
    SUM(commission) as comissao_liquida,
    SUM(amount) as comissao_bruta
  FROM unique_orders
  GROUP BY data_d
  ORDER BY data_d ASC;
$function$;

-- Fix get_relatorio_comissoes (add explicit search_path)
CREATE OR REPLACE FUNCTION public.get_relatorio_comissoes(data_inicio timestamp with time zone, data_fim timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path = public
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_agg(t) INTO result
  FROM (
    SELECT
      order_status as status_pedido,
      count(*) as quantidade_pedidos,
      round(coalesce(sum(total_commission), 0), 2) as total_comissao,
      round(coalesce(sum(shopee_commission), 0), 2) as comissao_shopee,
      round(coalesce(sum(seller_commission), 0), 2) as comissao_vendedor
    FROM shopee_vendas
    WHERE purchase_time >= data_inicio 
      AND purchase_time <= data_fim
      AND order_status NOT IN ('CANCELLED', 'INVALID', 'VOID', 'INCOMPLETE')
    GROUP BY order_status
  ) t;
  RETURN coalesce(result, '[]'::json);
END;
$function$;

-- =====================================================
-- Revoke EXECUTE from anon on all sensitive functions
-- Only authenticated users should call these functions
-- =====================================================

-- Revoke anon access from all sensitive RPC functions
REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_day_analysis_aggregations FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_unified_table_aggregations FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relatorio_financeiro_br(timestamp with time zone, timestamp with time zone) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relatorio_financeiro_br(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relatorio_financeiro_br_simple FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relatorio_diario_network FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relatorio_comissoes FROM anon;

-- Ensure only authenticated users can execute these functions
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_day_analysis_aggregations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unified_table_aggregations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relatorio_financeiro_br(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relatorio_financeiro_br(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relatorio_financeiro_br_simple TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relatorio_diario_network TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relatorio_comissoes TO authenticated;