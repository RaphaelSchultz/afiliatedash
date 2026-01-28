-- Fix get_relatorio_financeiro_br to exclude CANCELLED orders and use MAX for commission
CREATE OR REPLACE FUNCTION public.get_relatorio_financeiro_br(data_inicio timestamp with time zone, data_fim timestamp with time zone)
 RETURNS TABLE(data_pedido text, qtd_vendas bigint, comissao_liquida numeric, comissao_bruta numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH filtered_vendas AS (
    SELECT 
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      order_id,
      COALESCE(actual_amount::numeric, 0) as amount,
      COALESCE(net_commission::numeric, 0) as commission
    FROM shopee_vendas
    WHERE user_id = auth.uid()
      AND purchase_time >= data_inicio
      AND purchase_time <= data_fim
      -- Exclude CANCELLED orders to match Shopee panel
      AND UPPER(COALESCE(status, '')) NOT IN ('CANCELLED', 'CANCELADO')
  ),
  
  -- Comissão: MAX por order_id (evita duplicidade em pedidos multi-item)
  order_commissions AS (
    SELECT 
      data_d,
      order_id,
      MAX(commission) as max_commission,
      SUM(amount) as order_gmv
    FROM filtered_vendas
    GROUP BY data_d, order_id
  ),
  
  -- Agregação por dia
  daily_stats AS (
    SELECT 
      data_d,
      COUNT(*) as pedidos,
      SUM(max_commission) as total_commission,
      SUM(order_gmv) as total_gmv
    FROM order_commissions
    GROUP BY data_d
  )
  
  SELECT 
    data_d as data_pedido,
    pedidos as qtd_vendas,
    total_commission as comissao_liquida,
    total_gmv as comissao_bruta
  FROM daily_stats
  ORDER BY data_pedido ASC;
$function$;

-- Fix get_relatorio_diario_network to exclude CANCELLED orders
CREATE OR REPLACE FUNCTION public.get_relatorio_diario_network(data_inicio_texto text, data_fim_texto text)
 RETURNS TABLE(data_pedido text, qtd_vendas bigint, comissao_liquida numeric, comissao_bruta numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inicio_utc timestamp with time zone;
  v_fim_utc timestamp with time zone;
BEGIN
  -- 1. DEFINE A JANELA DE TEMPO (BLINDADA)
  v_inicio_utc := (data_inicio_texto || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_fim_utc    := (data_fim_texto    || ' 23:59:59.999')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  RETURN QUERY
  WITH filtered_orders AS (
    SELECT 
      TO_CHAR(purchase_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      order_id,
      actual_amount,
      net_commission
    FROM shopee_vendas
    WHERE 
      user_id = auth.uid()
      AND purchase_time >= v_inicio_utc
      AND purchase_time <= v_fim_utc
      AND actual_amount > 0
      -- Exclude CANCELLED orders to match Shopee panel
      AND UPPER(COALESCE(status, '')) NOT IN ('CANCELLED', 'CANCELADO')
  ),
  
  -- Aggregate by order_id to avoid double-counting
  order_aggregates AS (
    SELECT 
      data_d,
      order_id,
      SUM(actual_amount) as order_gmv,
      MAX(net_commission) as max_commission
    FROM filtered_orders
    GROUP BY data_d, order_id
  )
  
  SELECT 
    data_d as data_pedido,
    COUNT(DISTINCT order_id) as qtd_vendas,
    COALESCE(SUM(max_commission), 0) as comissao_liquida,
    COALESCE(SUM(order_gmv), 0) as comissao_bruta
  FROM order_aggregates
  GROUP BY data_d
  ORDER BY data_pedido ASC;
END;
$function$;