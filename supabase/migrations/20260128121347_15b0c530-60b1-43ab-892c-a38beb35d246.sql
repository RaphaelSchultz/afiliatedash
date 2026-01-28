-- Create a new RPC function for UnifiedTable aggregation
-- This aggregates data by SubID combinations server-side for accuracy
CREATE OR REPLACE FUNCTION public.get_unified_table_aggregations(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone,
  p_status text[] DEFAULT NULL,
  p_channels text[] DEFAULT NULL,
  p_sub_id1 text[] DEFAULT NULL,
  p_sub_id2 text[] DEFAULT NULL,
  p_sub_id3 text[] DEFAULT NULL,
  p_sub_id4 text[] DEFAULT NULL,
  p_sub_id5 text[] DEFAULT NULL,
  p_include_sub2 boolean DEFAULT true,
  p_include_sub3 boolean DEFAULT true,
  p_include_sub4 boolean DEFAULT false,
  p_include_sub5 boolean DEFAULT false
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
      COALESCE(sv.sub_id1, 'Sem Sub ID') as sub1,
      COALESCE(sv.sub_id2, 'Sem Sub ID') as sub2,
      COALESCE(sv.sub_id3, 'Sem Sub ID') as sub3,
      COALESCE(sv.sub_id4, 'Sem Sub ID') as sub4,
      COALESCE(sv.sub_id5, 'Sem Sub ID') as sub5,
      COALESCE(sv.actual_amount, 0) as amount,
      COALESCE(sv.net_commission, 0) as commission
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
  -- Build grouping key based on which columns are visible
  keyed_vendas AS (
    SELECT 
      order_id,
      sub1,
      CASE WHEN p_include_sub2 THEN sub2 ELSE NULL END as sub2_key,
      CASE WHEN p_include_sub3 THEN sub3 ELSE NULL END as sub3_key,
      CASE WHEN p_include_sub4 THEN sub4 ELSE NULL END as sub4_key,
      CASE WHEN p_include_sub5 THEN sub5 ELSE NULL END as sub5_key,
      sub2, sub3, sub4, sub5,
      amount,
      commission,
      -- Build row key for grouping
      CONCAT_WS('|',
        CASE WHEN sub1 != 'Sem Sub ID' THEN sub1 ELSE NULL END,
        CASE WHEN p_include_sub2 AND sub2 != 'Sem Sub ID' THEN sub2 ELSE NULL END,
        CASE WHEN p_include_sub3 AND sub3 != 'Sem Sub ID' THEN sub3 ELSE NULL END,
        CASE WHEN p_include_sub4 AND sub4 != 'Sem Sub ID' THEN sub4 ELSE NULL END,
        CASE WHEN p_include_sub5 AND sub5 != 'Sem Sub ID' THEN sub5 ELSE NULL END
      ) as row_key
    FROM filtered_vendas
  ),
  -- Handle empty keys (no sub IDs)
  keyed_with_default AS (
    SELECT 
      order_id,
      sub1, sub2, sub3, sub4, sub5,
      amount,
      commission,
      CASE WHEN row_key = '' THEN 'sem_sub_id' ELSE row_key END as row_key
    FROM keyed_vendas
  ),
  -- Aggregate: SUM amount per item, SUM commission per order (to avoid double counting)
  order_totals AS (
    SELECT 
      row_key,
      order_id,
      MAX(sub1) as sub1,
      MAX(sub2) as sub2,
      MAX(sub3) as sub3,
      MAX(sub4) as sub4,
      MAX(sub5) as sub5,
      SUM(amount) as order_amount,
      SUM(commission) as order_commission
    FROM keyed_with_default
    GROUP BY row_key, order_id
  ),
  -- Final aggregation by row_key
  grouped_data AS (
    SELECT 
      row_key,
      MAX(sub1) as sub1,
      MAX(sub2) as sub2,
      MAX(sub3) as sub3,
      MAX(sub4) as sub4,
      MAX(sub5) as sub5,
      SUM(order_amount) as total_value,
      COUNT(DISTINCT order_id) as quantity,
      SUM(order_commission) as commission
    FROM order_totals
    GROUP BY row_key
  )
  SELECT json_agg(
    json_build_object(
      'rowKey', row_key,
      'sub1', CASE WHEN row_key = 'sem_sub_id' THEN 'Sem Sub IDs' ELSE sub1 END,
      'sub2', CASE WHEN row_key = 'sem_sub_id' THEN '-' ELSE sub2 END,
      'sub3', CASE WHEN row_key = 'sem_sub_id' THEN '-' ELSE sub3 END,
      'sub4', CASE WHEN row_key = 'sem_sub_id' THEN '-' ELSE sub4 END,
      'sub5', CASE WHEN row_key = 'sem_sub_id' THEN '-' ELSE sub5 END,
      'totalValue', total_value,
      'quantity', quantity,
      'commission', commission
    )
    ORDER BY commission DESC
  ) INTO result
  FROM grouped_data;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;