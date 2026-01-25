-- =============================================
-- CORREÇÃO COMPLETA: shopee_settlements
-- =============================================
DROP POLICY IF EXISTS "Users can view own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can insert own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can update own settlements" ON public.shopee_settlements;
DROP POLICY IF EXISTS "Users can delete own settlements" ON public.shopee_settlements;

CREATE POLICY "Users can view own settlements"
ON public.shopee_settlements FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settlements"
ON public.shopee_settlements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settlements"
ON public.shopee_settlements FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settlements"
ON public.shopee_settlements FOR DELETE TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON public.shopee_settlements FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopee_settlements TO authenticated;

-- =============================================
-- CORREÇÃO COMPLETA: investments_manual
-- =============================================
DROP POLICY IF EXISTS "Users can manage own investments" ON public.investments_manual;
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments_manual;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments_manual;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments_manual;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments_manual;

CREATE POLICY "Users can view own investments"
ON public.investments_manual FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
ON public.investments_manual FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
ON public.investments_manual FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
ON public.investments_manual FOR DELETE TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON public.investments_manual FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments_manual TO authenticated;

-- =============================================
-- CORREÇÃO: shopee_sync_control (sem RLS policies)
-- =============================================
-- Esta tabela é de controle interno, restringir a service_role apenas
REVOKE ALL ON public.shopee_sync_control FROM anon;
REVOKE ALL ON public.shopee_sync_control FROM authenticated;

-- =============================================
-- CORREÇÃO: Function Search Path Mutable
-- =============================================
CREATE OR REPLACE FUNCTION public.get_relatorio_financeiro_br(data_inicio timestamp with time zone, data_fim timestamp with time zone)
RETURNS TABLE(data_pedido text, qtd_vendas bigint, comissao_liquida numeric, comissao_bruta numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  WITH pedidos_agregados AS (
    SELECT 
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_br,
      order_id,
      MAX(COALESCE(net_commission::numeric, 0)) as comissao_pedido,
      SUM(COALESCE(actual_amount::numeric, 0)) as gmv_pedido
    FROM shopee_vendas
    WHERE TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
          BETWEEN TO_CHAR(data_inicio AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
              AND TO_CHAR(data_fim AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
      AND order_status IN ('COMPLETED', 'PENDING')
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

CREATE OR REPLACE FUNCTION public.get_relatorio_financeiro_br_simple(data_inicio timestamp with time zone, data_fim timestamp with time zone)
RETURNS TABLE(data_pedido text, qtd_vendas bigint, comissao_liquida numeric, comissao_bruta numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  WITH unique_orders AS (
    SELECT DISTINCT ON (order_id)
      TO_CHAR(purchase_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as data_d,
      order_id,
      actual_amount::numeric as amount,
      net_commission::numeric as commission
    FROM shopee_vendas
    WHERE purchase_time >= data_inicio 
      AND purchase_time <= data_fim
      AND order_status IN ('COMPLETED', 'PENDING')
    ORDER BY order_id, purchase_time DESC
  )
  SELECT 
    data_d as data_pedido,
    COUNT(*) as qtd_vendas,
    SUM(commission) as comissao_liquida,
    SUM(amount) as comissao_bruta
  FROM unique_orders
  GROUP BY data_d
  ORDER BY data_d ASC;
$function$;

CREATE OR REPLACE FUNCTION public.get_relatorio_comissoes(data_inicio timestamp with time zone, data_fim timestamp with time zone)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_agg(t) INTO result
  FROM (
    SELECT
      order_status as status_pedido,
      count(*) as quantidade_pedidos,
      round(coalesce(sum(total_commission), 0), 2) as total_comissao,
      round(coalesce(sum(shopee_commission), 0), 2) as comissao_shopee,
      round(coalesce(sum(seller_commission), 0), 2) as comissao_vendedor
    FROM shopee_vendas
    WHERE purchase_time >= data_inicio 
      AND purchase_time <= data_fim
      AND order_status NOT IN ('CANCELLED', 'INVALID', 'VOID', 'INCOMPLETE')
    GROUP BY order_status
  ) t;
  RETURN coalesce(result, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;