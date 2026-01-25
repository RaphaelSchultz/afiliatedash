// Dashboard calculation utilities
// Aligns with get_relatorio_financeiro_br SQL function logic

import type { Tables } from '@/integrations/supabase/types';
import { getShopeeDay } from './shopeeTimezone';

type ShopeeVenda = Tables<'shopee_vendas'>;

// Valid statuses for commission calculation (aligned with SQL function)
export const VALID_ORDER_STATUSES = ['COMPLETED', 'PENDING', 'Completed', 'Pending'];

export interface DashboardKPIs {
  totalGMV: number;
  netCommission: number;
  totalOrders: number;
  avgTicket: number;
}

export interface OrderAggregation {
  orderId: string;
  gmv: number;
  netCommission: number;
  status: string | null;
  shopeeDay: string;
}

/**
 * Aggregate vendas by order_id to avoid double-counting
 * Commission is counted once per order (max value among items)
 */
export function aggregateByOrder(vendas: ShopeeVenda[]): OrderAggregation[] {
  const orderMap = new Map<string, OrderAggregation>();

  for (const venda of vendas) {
    const orderId = venda.order_id;
    const existing = orderMap.get(orderId);

    if (!existing) {
      orderMap.set(orderId, {
        orderId,
        gmv: venda.actual_amount || 0,
        netCommission: venda.net_commission || 0,
        status: venda.order_status || venda.status,
        shopeeDay: venda.purchase_time ? getShopeeDay(venda.purchase_time) : '',
      });
    } else {
      // Sum GMV across all items in the order
      existing.gmv += venda.actual_amount || 0;
      // Take the max commission (commission is per order, not per item)
      existing.netCommission = Math.max(existing.netCommission, venda.net_commission || 0);
    }
  }

  return Array.from(orderMap.values());
}

/**
 * Calculate KPIs from vendas data
 * Follows the same logic as get_relatorio_financeiro_br:
 * - GMV: sum of actual_amount for valid statuses
 * - Commission: counted once per order for valid statuses
 */
export function calculateKPIs(vendas: ShopeeVenda[]): DashboardKPIs {
  const orders = aggregateByOrder(vendas);
  
  // Filter orders with valid status
  const validOrders = orders.filter(order => 
    order.status && VALID_ORDER_STATUSES.includes(order.status)
  );

  const totalGMV = validOrders.reduce((sum, order) => sum + order.gmv, 0);
  const netCommission = validOrders.reduce((sum, order) => sum + order.netCommission, 0);
  const totalOrders = validOrders.length;
  const avgTicket = totalOrders > 0 ? totalGMV / totalOrders : 0;

  return {
    totalGMV,
    netCommission,
    totalOrders,
    avgTicket,
  };
}

/**
 * Group orders by Shopee day for chart display
 */
export function groupByShopeeDay(vendas: ShopeeVenda[]): Map<string, { gmv: number; commission: number; orders: number }> {
  const orders = aggregateByOrder(vendas);
  const dayMap = new Map<string, { gmv: number; commission: number; orders: number }>();

  for (const order of orders) {
    if (!order.shopeeDay) continue;
    
    // Only count valid statuses
    if (!order.status || !VALID_ORDER_STATUSES.includes(order.status)) continue;

    const existing = dayMap.get(order.shopeeDay);
    if (!existing) {
      dayMap.set(order.shopeeDay, {
        gmv: order.gmv,
        commission: order.netCommission,
        orders: 1,
      });
    } else {
      existing.gmv += order.gmv;
      existing.commission += order.netCommission;
      existing.orders += 1;
    }
  }

  return dayMap;
}
