-- Fix: Atualizar RPC para normalizar status e incluir variantes PT-BR
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_start_date timestamp with time zone, 
  p_end_date timestamp with time zone, 
  p_status text[] DEFAULT NULL::text[], 
  p_channels text[] DEFAULT NULL::text[], 
  p_sub_id1 text[] DEFAULT NULL::text[], 
  p_sub_id2 text[] DEFAULT NULL::text[], 
  p_sub_id3 text[] DEFAULT NULL::text[], 
  p_sub_id4 text[] DEFAULT NULL::text[], 
  p_sub_id5 text[] DEFAULT NULL::text[]
)
RETURNS TABLE(total_gmv numeric, net_commission numeric, total_orders bigint, avg_ticket numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH 
  -- Normalize status values to handle PT-BR variants
  normalized_status AS (
    SELECT CASE 
      WHEN UPPER(unnest) IN ('COMPLETED', 'CONCLUÍDO') THEN 'COMPLETED'
      WHEN UPPER(unnest) IN ('PENDING', 'PENDENTE') THEN 'PENDING'
      WHEN UPPER(unnest) IN ('CANCELLED', 'CANCELADO') THEN 'CANCELLED'
      ELSE UPPER(unnest)
    END as status
    FROM unnest(p_status)
  ),
  filtered_vendas AS (
    SELECT 
      sv.order_id,
      sv.actual_amount,
      sv.net_commission as commission
    FROM shopee_vendas sv
    WHERE sv.user_id = auth.uid()
      AND sv.purchase_time >= p_start_date
      AND sv.purchase_time <= p_end_date
      -- Status filter: normalize both sides for comparison
      AND (p_status IS NULL OR array_length(p_status, 1) IS NULL OR 
           (CASE 
              WHEN UPPER(COALESCE(sv.status, sv.order_status, '')) IN ('COMPLETED', 'CONCLUÍDO') THEN 'COMPLETED'
              WHEN UPPER(COALESCE(sv.status, sv.order_status, '')) IN ('PENDING', 'PENDENTE') THEN 'PENDING'
              WHEN UPPER(COALESCE(sv.status, sv.order_status, '')) IN ('CANCELLED', 'CANCELADO') THEN 'CANCELLED'
              ELSE UPPER(COALESCE(sv.status, sv.order_status, ''))
            END) IN (SELECT status FROM normalized_status)
          )
      -- Channel filter
      AND (p_channels IS NULL OR array_length(p_channels, 1) IS NULL OR 
           sv.channel = ANY(p_channels))
      -- SubID filters
      AND (p_sub_id1 IS NULL OR array_length(p_sub_id1, 1) IS NULL OR 
           sv.sub_id1 = ANY(p_sub_id1) OR 
           ('__NULL__' = ANY(p_sub_id1) AND sv.sub_id1 IS NULL))
      AND (p_sub_id2 IS NULL OR array_length(p_sub_id2, 1) IS NULL OR 
           sv.sub_id2 = ANY(p_sub_id2) OR 
           ('__NULL__' = ANY(p_sub_id2) AND sv.sub_id2 IS NULL))
      AND (p_sub_id3 IS NULL OR array_length(p_sub_id3, 1) IS NULL OR 
           sv.sub_id3 = ANY(p_sub_id3) OR 
           ('__NULL__' = ANY(p_sub_id3) AND sv.sub_id3 IS NULL))
      AND (p_sub_id4 IS NULL OR array_length(p_sub_id4, 1) IS NULL OR 
           sv.sub_id4 = ANY(p_sub_id4) OR 
           ('__NULL__' = ANY(p_sub_id4) AND sv.sub_id4 IS NULL))
      AND (p_sub_id5 IS NULL OR array_length(p_sub_id5, 1) IS NULL OR 
           sv.sub_id5 = ANY(p_sub_id5) OR 
           ('__NULL__' = ANY(p_sub_id5) AND sv.sub_id5 IS NULL))
  ),
  -- Aggregate by order_id: SUM for both GMV and commission (correct for Shopee data structure)
  order_totals AS (
    SELECT 
      fv.order_id,
      SUM(COALESCE(fv.actual_amount, 0)) as order_gmv,
      SUM(COALESCE(fv.commission, 0)) as order_commission
    FROM filtered_vendas fv
    GROUP BY fv.order_id
  )
  SELECT 
    COALESCE(SUM(ot.order_gmv), 0) as total_gmv,
    COALESCE(SUM(ot.order_commission), 0) as net_commission,
    COUNT(ot.order_id) as total_orders,
    CASE 
      WHEN COUNT(ot.order_id) > 0 
      THEN ROUND(SUM(ot.order_gmv) / COUNT(ot.order_id), 2)
      ELSE 0 
    END as avg_ticket
  FROM order_totals ot;
END;
$function$;