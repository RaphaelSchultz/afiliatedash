CREATE OR REPLACE FUNCTION get_relatorio_financeiro_br(data_inicio timestamp with time zone, data_fim timestamp with time zone)
RETURNS TABLE (
  data_pedido text,
  qtd_vendas bigint,
  comissao_liquida numeric,
  comissao_bruta numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days INT;
  v_min_allowed_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- ETAPA A: Definição do Limite (Segurança do Plano)
  -- Recupera dias do plano (default 3 se não encontrar) e define data de corte
  SELECT COALESCE((p.config->>'data_retention_days')::INT, 3) 
  INTO v_retention_days 
  FROM plans p
  JOIN subscriptions s ON p.id = s.plan_id
  WHERE s.user_id = auth.uid() AND s.status = 'active';

  -- Se não achou plano ativo, assume 3 dias (fallback)
  v_retention_days := COALESCE(v_retention_days, 3);
  
  -- Calcula a data mínima permitida (Meia-noite SP) baseada na retenção
  v_min_allowed_date := (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo') - (v_retention_days || ' days')::INTERVAL);

  RETURN QUERY
  WITH filtered_vendas AS (
    SELECT 
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      order_id,
      COALESCE(actual_amount::numeric, 0) as amount,
      COALESCE(net_commission::numeric, 0) as commission
    FROM shopee_vendas
    WHERE user_id = auth.uid()
      -- ETAPA B: Filtragem Inteligente (Segurança)
      -- Garante que nunca busque além do permitido pelo plano, usando GREATEST
      AND purchase_time >= GREATEST(data_inicio, v_min_allowed_date)
      AND purchase_time <= data_fim
      -- Exclui CANCELLED (Regra de Negócio Shopee)
      AND UPPER(COALESCE(status, '')) NOT IN ('CANCELLED', 'CANCELADO')
  ),
  -- ETAPA C: Agregação (Visualização)
  -- Mantém a lógica de agrupar por data para o gráfico, somando primeiro por order_id para evitar duplicidade de itens
  order_commissions AS (
    SELECT 
      data_d,
      order_id,
      SUM(commission) as total_commission,
      SUM(amount) as order_gmv
    FROM filtered_vendas
    GROUP BY data_d, order_id
  ),
  daily_stats AS (
    SELECT 
      data_d,
      COUNT(*) as pedidos,
      SUM(total_commission) as total_commission,
      SUM(order_gmv) as total_gmv
    FROM order_commissions
    GROUP BY data_d
  )
  SELECT 
    daily_stats.data_d as data_pedido,
    daily_stats.pedidos as qtd_vendas,
    COALESCE(daily_stats.total_commission, 0) as comissao_liquida,
    COALESCE(daily_stats.total_gmv, 0) as comissao_bruta
  FROM daily_stats
  ORDER BY data_pedido ASC;
END;
$$;
