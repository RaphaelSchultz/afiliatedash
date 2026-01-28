-- Fix the text-based version of get_relatorio_financeiro_br
CREATE OR REPLACE FUNCTION public.get_relatorio_financeiro_br(data_inicio text, data_fim text)
 RETURNS TABLE(contagem_id_pedido bigint, soma_valor_compra numeric, soma_comissao_liquida numeric)
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH itens_unicos AS (
    SELECT
      order_id,
      item_id,
      MAX(actual_amount) as item_gmv, 
      SUM(net_commission) as item_comm
    FROM
      shopee_vendas
    WHERE
      user_id = auth.uid()
      AND purchase_time >= data_inicio::timestamp with time zone
      AND purchase_time <= data_fim::timestamp with time zone
      AND actual_amount > 0
    GROUP BY
      order_id,
      item_id
  )
  SELECT
    COUNT(DISTINCT order_id) as contagem_id_pedido,
    COALESCE(SUM(item_gmv), 0) as soma_valor_compra,
    COALESCE(SUM(item_comm), 0) as soma_comissao_liquida
  FROM
    itens_unicos;
END;
$function$;