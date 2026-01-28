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
  WITH itens_processados AS (
    -- 1. Deduplicação Inteligente
    -- Agrupa por Item para não somar o valor de venda repetido
    SELECT
      -- Converte UTC do banco para Horário de Brasília antes de extrair o dia
      TO_CHAR(purchase_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_ref,
      order_id,
      item_id,
      MAX(actual_amount) as item_gmv, -- Pega o valor cheio apenas uma vez
      SUM(net_commission) as item_comm -- Soma as comissões parciais
    FROM
      shopee_vendas
    WHERE
      user_id = auth.uid()
      AND purchase_time >= data_inicio::timestamp with time zone
      AND purchase_time <= data_fim::timestamp with time zone
      -- REMOVED "AND actual_amount > 0" to include verified orders with 0 amount (e.g. vouchers/gifts)
    GROUP BY
      TO_CHAR(purchase_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD'),
      order_id,
      item_id
  )
  -- 2. Agrupamento Final por Dia (Formato Array para o React)
  SELECT
    data_ref as data_pedido,
    COUNT(DISTINCT order_id) as qtd_vendas,
    COALESCE(SUM(item_comm), 0) as comissao_liquida,
    COALESCE(SUM(item_gmv), 0) as comissao_bruta
  FROM
    itens_processados
  GROUP BY
    data_ref
  ORDER BY
    data_ref ASC;
END;
$$;
