-- VERSÃO CORRIGIDA - Timezone Fix + Status PT-BR + RLS
-- Problema: WHERE filtra por timestamp UTC, mas GROUP BY usa timezone BR
-- Solução: Filtrar DIRETO pela data brasileira convertida

CREATE OR REPLACE FUNCTION get_relatorio_financeiro_br(
  data_inicio timestamp with time zone,
  data_fim timestamp with time zone
)
RETURNS TABLE (
  data_pedido text,
  qtd_vendas bigint,
  comissao_liquida numeric,
  comissao_bruta numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH 
  -- Pedidos únicos (1x por order_id) - FILTRO PELA DATA BRASILEIRA
  unique_orders AS (
    SELECT DISTINCT ON (order_id)
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      order_id,
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
    ORDER BY order_id, purchase_time DESC
  ),
  
  -- GMV total (todas as linhas) - MESMO FILTRO
  gmv_total AS (
    SELECT 
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      SUM(COALESCE(actual_amount::numeric, 0)) as total_gmv
    FROM shopee_vendas
    WHERE user_id = auth.uid()
      AND TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
          BETWEEN TO_CHAR(data_inicio AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
              AND TO_CHAR(data_fim AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
      AND (
        order_status IN ('COMPLETED', 'PENDING', 'Concluído', 'Pendente', 'Completo')
        OR order_status IS NULL
      )
    GROUP BY 1
  )
  
  -- Junção
  SELECT 
    COALESCE(u.data_d, g.data_d) as data_pedido,
    COALESCE(COUNT(u.order_id), 0) as qtd_vendas,
    COALESCE(SUM(u.commission), 0) as comissao_liquida,
    COALESCE(g.total_gmv, 0) as comissao_bruta
  FROM unique_orders u
  FULL OUTER JOIN gmv_total g ON u.data_d = g.data_d
  GROUP BY u.data_d, g.data_d, g.total_gmv
  ORDER BY data_pedido ASC;
$$;