CREATE OR REPLACE FUNCTION get_relatorio_diario_network(data_inicio_texto text, data_fim_texto text)
RETURNS TABLE (
  data_pedido text,
  qtd_vendas bigint,
  comissao_liquida numeric,
  comissao_bruta numeric
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função rode sem restrições de permissão do usuário
SET search_path = public -- Garante que rode no schema correto
AS $$
DECLARE
  v_inicio_utc timestamp with time zone;
  v_fim_utc timestamp with time zone;
BEGIN
  -- Conversão de Timezone (Mantida)
  v_inicio_utc := (data_inicio_texto || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_fim_utc    := (data_fim_texto    || ' 23:59:59.999')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  RETURN QUERY
  WITH itens_unicos AS (
    SELECT
      TO_CHAR(purchase_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_ref,
      order_id,
      item_id,
      -- 🔴 CORREÇÃO AQUI: Mudamos de MAX para SUM
      -- Se houver 4 linhas de R$ 38,00 compondo um kit, agora somamos para R$ 152,00 (Correto)
      SUM(actual_amount) as item_gmv,   
      SUM(net_commission) as item_comm
    FROM
      shopee_vendas
    WHERE
      user_id = auth.uid()
      AND purchase_time >= v_inicio_utc
      AND purchase_time <= v_fim_utc
      AND actual_amount > 0
    GROUP BY
      TO_CHAR(purchase_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD'),
      order_id,
      item_id
  )
  SELECT
    data_ref as data_pedido,
    COUNT(DISTINCT order_id) as qtd_vendas,
    COALESCE(SUM(item_comm), 0) as comissao_liquida,
    COALESCE(SUM(item_gmv), 0) as comissao_bruta
  FROM
    itens_unicos
  GROUP BY
    data_ref
  ORDER BY
    data_ref ASC;
END;
$$;
