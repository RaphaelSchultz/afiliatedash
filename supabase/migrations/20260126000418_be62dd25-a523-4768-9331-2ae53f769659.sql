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
      COALESCE(item_commission::numeric, 0) as commission
    FROM shopee_vendas
    WHERE user_id = auth.uid()
      AND TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') 
          BETWEEN TO_CHAR(data_inicio AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
              AND TO_CHAR(data_fim AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
      AND order_status IN ('COMPLETED', 'PENDING', 'Concluído', 'Pendente', 'Completo')
  ),
  
  -- Agregação por dia
  daily_stats AS (
    SELECT 
      data_d,
      COUNT(DISTINCT order_id) as pedidos,
      SUM(commission) as total_commission,
      SUM(amount) as total_gmv
    FROM filtered_vendas
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