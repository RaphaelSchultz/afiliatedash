-- Check total count for Jan 2026 to see if it exceeds 1000
SELECT count(*) 
FROM shopee_vendas 
WHERE purchase_time >= '2026-01-01' AND purchase_time < '2026-02-01';

-- Check if we have more statuses
SELECT DISTINCT order_status, count(*) 
FROM shopee_vendas 
GROUP BY order_status;
