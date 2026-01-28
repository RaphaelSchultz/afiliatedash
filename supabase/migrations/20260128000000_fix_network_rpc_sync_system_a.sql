CREATE OR REPLACE FUNCTION public.get_relatorio_diario_network(data_inicio_texto text, data_fim_texto text)
RETURNS TABLE (
  data_pedido text,
  qtd_vendas bigint,
  comissao_liquida numeric,
  comissao_bruta numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio_utc timestamp with time zone;
  v_fim_utc timestamp with time zone;
BEGIN
  -- 1. DEFINE A JANELA DE TEMPO (BLINDADA)
  -- Garante que 00:00 do Brasil seja convertido correntamente para UTC
  v_inicio_utc := (data_inicio_texto || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_fim_utc    := (data_fim_texto    || ' 23:59:59.999')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  RETURN QUERY
  WITH filtered_vendas AS (
    SELECT 
      -- Recupera a data visual (Brasil) para agrupamento
      TO_CHAR(purchase_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_ref,
      order_id,
      COALESCE(actual_amount::numeric, 0) as amount,
      COALESCE(net_commission::numeric, 0) as commission
    FROM shopee_vendas
    WHERE user_id = auth.uid()
      AND purchase_time >= v_inicio_utc
      AND purchase_time <= v_fim_utc
      -- REMOVIDO FILTRO 'actual_amount > 0' para igualar ao System A
  ),
  
  -- 2. AGREGAÇÃO POR PEDIDO (IGUAL AO SYSTEM A)
  order_commissions AS (
    SELECT 
      data_ref,
      order_id,
      -- System A usa MAX para comissão (evita duplicar comissão se vier repetida nas linhas)
      MAX(commission) as max_commission,
      -- System A usa SUM para valor (soma fatias do pedido)
      SUM(amount) as order_gmv
    FROM filtered_vendas
    GROUP BY data_ref, order_id
  )

  -- 3. TOTAIS DO DIA
  SELECT 
    data_ref as data_pedido,
    COUNT(DISTINCT order_id) as qtd_vendas,
    COALESCE(SUM(max_commission), 0) as comissao_liquida,
    COALESCE(SUM(order_gmv), 0) as comissao_bruta
  FROM order_commissions
  GROUP BY data_ref
  ORDER BY data_pedido ASC;
END;
$$;
