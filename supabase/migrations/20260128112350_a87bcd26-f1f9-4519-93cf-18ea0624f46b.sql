-- RPC function to aggregate data by SubID, Channel, and Status for Day Analysis tables
-- This ensures accurate totals regardless of the dataset size

CREATE OR REPLACE FUNCTION public.get_day_analysis_aggregations(
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
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  WITH filtered_vendas AS (
    SELECT 
      sv.order_id,
      sv.sub_id1,
      sv.sub_id2,
      sv.sub_id3,
      sv.sub_id4,
      sv.sub_id5,
      sv.channel,
      sv.status,
      sv.actual_amount,
      sv.net_commission
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
  -- Aggregate by order first to get correct commission per order
  order_totals AS (
    SELECT 
      order_id,
      MAX(sub_id1) as sub_id1,
      MAX(sub_id2) as sub_id2,
      MAX(sub_id3) as sub_id3,
      MAX(sub_id4) as sub_id4,
      MAX(sub_id5) as sub_id5,
      MAX(channel) as channel,
      MAX(status) as status,
      SUM(COALESCE(actual_amount, 0)) as order_gmv,
      SUM(COALESCE(net_commission, 0)) as order_commission
    FROM filtered_vendas
    GROUP BY order_id
  ),
  -- Aggregate by sub_id1
  sub1_agg AS (
    SELECT 
      COALESCE(sub_id1, 'Sem Sub ID') as key,
      SUM(order_commission) as total_commission,
      COUNT(*) as count
    FROM order_totals
    GROUP BY COALESCE(sub_id1, 'Sem Sub ID')
  ),
  -- Aggregate by sub_id2
  sub2_agg AS (
    SELECT 
      COALESCE(sub_id2, 'Sem Sub ID') as key,
      SUM(order_commission) as total_commission,
      COUNT(*) as count
    FROM order_totals
    GROUP BY COALESCE(sub_id2, 'Sem Sub ID')
  ),
  -- Aggregate by sub_id3
  sub3_agg AS (
    SELECT 
      COALESCE(sub_id3, 'Sem Sub ID') as key,
      SUM(order_commission) as total_commission,
      COUNT(*) as count
    FROM order_totals
    GROUP BY COALESCE(sub_id3, 'Sem Sub ID')
  ),
  -- Aggregate by sub_id4
  sub4_agg AS (
    SELECT 
      COALESCE(sub_id4, 'Sem Sub ID') as key,
      SUM(order_commission) as total_commission,
      COUNT(*) as count
    FROM order_totals
    GROUP BY COALESCE(sub_id4, 'Sem Sub ID')
  ),
  -- Aggregate by sub_id5
  sub5_agg AS (
    SELECT 
      COALESCE(sub_id5, 'Sem Sub ID') as key,
      SUM(order_commission) as total_commission,
      COUNT(*) as count
    FROM order_totals
    GROUP BY COALESCE(sub_id5, 'Sem Sub ID')
  ),
  -- Aggregate by channel
  channel_agg AS (
    SELECT 
      COALESCE(channel, 'Sem Canal') as key,
      SUM(order_commission) as total_commission,
      COUNT(*) as count
    FROM order_totals
    GROUP BY COALESCE(channel, 'Sem Canal')
  ),
  -- Aggregate by status
  status_agg AS (
    SELECT 
      COALESCE(status, 'Sem Status') as key,
      SUM(order_commission) as total_commission,
      COUNT(*) as count
    FROM order_totals
    GROUP BY COALESCE(status, 'Sem Status')
  )
  SELECT json_build_object(
    'sub1', COALESCE((SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM sub1_agg ORDER BY total_commission DESC) s), '[]'::json),
    'sub2', COALESCE((SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM sub2_agg ORDER BY total_commission DESC) s), '[]'::json),
    'sub3', COALESCE((SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM sub3_agg ORDER BY total_commission DESC) s), '[]'::json),
    'sub4', COALESCE((SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM sub4_agg ORDER BY total_commission DESC) s), '[]'::json),
    'sub5', COALESCE((SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM sub5_agg ORDER BY total_commission DESC) s), '[]'::json),
    'channel', COALESCE((SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM channel_agg ORDER BY total_commission DESC) s), '[]'::json),
    'status', COALESCE((SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM status_agg ORDER BY total_commission DESC) s), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;