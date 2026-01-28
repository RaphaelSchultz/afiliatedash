CREATE OR REPLACE FUNCTION get_relatorio_diario_network(data_inicio text, data_fim text)
RETURNS TABLE (
  data_pedido text,       -- Data formatada 'YYYY-MM-DD' (Brasil)
  qtd_vendas bigint,      -- Quantidade de pedidos únicos
  comissao_liquida numeric, -- Soma correta das comissões
  comissao_bruta numeric    -- Soma correta do GMV (Valor da Venda)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_vendas AS (
    SELECT 
      -- Conversão de Fuso: Exatamente igual ao System A (get_relatorio_financeiro_br)
      -- De: TIMESTAMPTZ (Banco) -> Para: TIMESTAMP (Wall Clock Brasil)
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      order_id,
      COALESCE(actual_amount::numeric, 0) as amount,
      COALESCE(net_commission::numeric, 0) as commission
    FROM shopee_vendas
    WHERE user_id = auth.uid()
      AND purchase_time >= data_inicio::timestamp with time zone
      AND purchase_time <= data_fim::timestamp with time zone
  ),
  
  -- Agrupamento por Pedido (Igual ao System A)
  order_commissions AS (
    SELECT 
      data_d,
      order_id,
      MAX(commission) as max_commission,
      SUM(amount) as order_gmv
    FROM filtered_vendas
    GROUP BY data_d, order_id
  ),
  
  -- Agrupamento Final
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
END;
$$;
