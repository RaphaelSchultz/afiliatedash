-- Drop and recreate the function to handle Portuguese status values
CREATE OR REPLACE FUNCTION public.get_relatorio_financeiro_br(data_inicio timestamp with time zone, data_fim timestamp with time zone)
 RETURNS TABLE(data_pedido text, qtd_vendas bigint, comissao_liquida numeric, comissao_bruta numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH pedidos_agregados AS (
    SELECT 
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_br,
      order_id,
      MAX(COALESCE(net_commission::numeric, 0)) as comissao_pedido,
      SUM(COALESCE(actual_amount::numeric, 0)) as gmv_pedido
    FROM shopee_vendas
    WHERE user_id = auth.uid()
      AND TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
          BETWEEN TO_CHAR(data_inicio AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
              AND TO_CHAR(data_fim AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
      AND (
        order_status IN ('COMPLETED', 'PENDING', 'Concluído', 'Pendente', 'Completo')
        OR order_status IS NULL
      )
    GROUP BY data_br, order_id
  )
  SELECT 
    data_br as data_pedido,
    COUNT(order_id) as qtd_vendas,
    SUM(comissao_pedido) as comissao_liquida,
    SUM(gmv_pedido) as comissao_bruta
  FROM pedidos_agregados
  GROUP BY data_br
  ORDER BY data_pedido ASC;
$function$;