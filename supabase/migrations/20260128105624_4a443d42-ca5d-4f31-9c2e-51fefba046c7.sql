-- Create RPC function to calculate dashboard KPIs server-side
-- This avoids the 1000 row limit and ensures accurate aggregations

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone,
  p_status text[] DEFAULT NULL,
  p_channels text[] DEFAULT NULL,
  p_sub_id1 text[] DEFAULT NULL,
  p_sub_id2 text[] DEFAULT NULL,
  p_sub_id3 text[] DEFAULT NULL,
  p_sub_id4 text[] DEFAULT NULL,
  p_sub_id5 text[] DEFAULT NULL
)
RETURNS TABLE(
  total_gmv numeric,
  net_commission numeric,
  total_orders bigint,
  avg_ticket numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_vendas AS (
    SELECT 
      sv.order_id,
      sv.actual_amount,
      sv.net_commission as commission
    FROM shopee_vendas sv
    WHERE sv.user_id = auth.uid()
      AND sv.purchase_time >= p_start_date
      AND sv.purchase_time <= p_end_date
      -- Status filter
      AND (p_status IS NULL OR array_length(p_status, 1) IS NULL OR 
           UPPER(COALESCE(sv.status, '')) = ANY(
             SELECT UPPER(unnest(p_status))
           ))
      -- Channel filter
      AND (p_channels IS NULL OR array_length(p_channels, 1) IS NULL OR 
           sv.channel = ANY(p_channels))
      -- SubID filters - each filter only applies to its column
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
  -- Aggregate by order_id to avoid double-counting
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
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis TO anon;