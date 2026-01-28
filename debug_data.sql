-- Check distinct order_status
SELECT DISTINCT order_status FROM shopee_vendas;

-- Check a sample order with multiple rows (items)
SELECT order_id, item_name, actual_amount, net_commission, item_total_commission, total_commission 
FROM shopee_vendas 
WHERE order_id IN (
    SELECT order_id 
    FROM shopee_vendas 
    GROUP BY order_id 
    HAVING COUNT(*) > 1
) 
LIMIT 10;
