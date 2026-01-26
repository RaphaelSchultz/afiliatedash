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
      AND order_status IN ('COMPLETED', 'PENDING', 'Concluído', 'Pendente', 'Completo')
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
$function$