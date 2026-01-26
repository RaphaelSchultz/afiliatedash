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
      AND TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') 
          BETWEEN TO_CHAR(data_inicio AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
              AND TO_CHAR(data_fim AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
      AND (
        order_status IN ('COMPLETED', 'PENDING', 'Concluído', 'Pendente', 'Completo')
        OR order_status IS NULL
      )
  ),
  
  -- Comissão: MAX por order_id para evitar duplicidade em pedidos multi-item
  order_commissions AS (
    SELECT 
      data_d,
      order_id,
      MAX(commission) as max_commission
    FROM filtered_vendas
    GROUP BY data_d, order_id
  ),
  
  -- Agregação por dia
  daily_stats AS (
    SELECT 
      data_d,
      COUNT(DISTINCT order_id) as pedidos,
      SUM(max_commission) as total_commission
    FROM order_commissions
    GROUP BY data_d
  ),
  
  -- GMV: soma de actual_amount (todas as linhas)
  daily_gmv AS (
    SELECT 
      data_d,
      SUM(amount) as total_gmv
    FROM filtered_vendas
    GROUP BY data_d
  )
  
  SELECT 
    COALESCE(s.data_d, g.data_d) as data_pedido,
    COALESCE(s.pedidos, 0) as qtd_vendas,
    COALESCE(s.total_commission, 0) as comissao_liquida,
    COALESCE(g.total_gmv, 0) as comissao_bruta
  FROM daily_stats s
  FULL OUTER JOIN daily_gmv g ON s.data_d = g.data_d
  ORDER BY data_pedido ASC;
$function$