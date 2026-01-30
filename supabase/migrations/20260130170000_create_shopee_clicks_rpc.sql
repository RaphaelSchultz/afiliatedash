-- RPC for Shopee Clicks (CSV Data)
-- Returns JSON with summary, evolution, devices, countries, referrers

CREATE OR REPLACE FUNCTION get_shopee_clicks_dashboard(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSON;
BEGIN
  -- Validate dates
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Dates are required';
  END IF;

  WITH filtered_clicks AS (
    SELECT
      click_time AT TIME ZONE 'America/Sao_Paulo' as local_time,
      region,
      referrer,
      sub_id1,
      click_pv
    FROM shopee_clicks
    WHERE user_id = v_user_id
      AND click_time >= p_start_date
      AND click_time <= p_end_date
  ),
  
  -- 1. Evolution (Clicks per Day)
  evolution_stats AS (
    SELECT
      TO_CHAR(local_time, 'YYYY-MM-DD') as dia,
      COUNT(*) as total_clicks
    FROM filtered_clicks
    GROUP BY 1
    ORDER BY 1
  ),
  
  -- 2. Regions (Countries)
  region_stats AS (
    SELECT
      COALESCE(region, 'Desconhecido') as key,
      COUNT(*) as count
    FROM filtered_clicks
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  ),
  
  -- 3. Referrers
  referrer_stats AS (
    SELECT
      COALESCE(referrer, 'Direto') as key,
      COUNT(*) as count
    FROM filtered_clicks
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  ),
  
  -- 4. SubIDs (SubId1)
  subid_stats AS (
     SELECT
      COALESCE(sub_id1, 'N/A') as key,
      COUNT(*) as count
    FROM filtered_clicks
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  ),
  
  -- 5. Summary
  summary_stats AS (
    SELECT
      COUNT(*) as total_clicks,
      COUNT(DISTINCT region) as unique_regions,
      COUNT(DISTINCT referrer) as unique_referrers,
      COUNT(DISTINCT sub_id1) as unique_subids
    FROM filtered_clicks
  )
  
  SELECT json_build_object(
    'summary', (SELECT row_to_json(s) FROM summary_stats s),
    'evolution', (SELECT COALESCE(json_agg(e), '[]'::json) FROM evolution_stats e),
    'regions', (SELECT COALESCE(json_agg(r), '[]'::json) FROM region_stats r),
    'referrers', (SELECT COALESCE(json_agg(ref), '[]'::json) FROM referrer_stats ref),
    'subids', (SELECT COALESCE(json_agg(sub), '[]'::json) FROM subid_stats sub)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
