// Dashboard calculation utilities
// Aligns with get_relatorio_financeiro_br SQL function logic

import type { Tables } from '@/integrations/supabase/types';
import { getBrazilDay } from './shopeeTimezone';

type ShopeeVenda = Tables<'shopee_vendas'>;

// Valid statuses for commission calculation (includes Portuguese variants from Shopee BR)
export const VALID_ORDER_STATUSES = [
  'COMPLETED', 'PENDING', 'Completed', 'Pending',
  'Concluído', 'Pendente', // Portuguese variants
];

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
  brazilDay: string;
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
        // Use status first, then order_status as fallback
        status: venda.status || venda.order_status,
        brazilDay: venda.purchase_time ? getBrazilDay(venda.purchase_time) : '',
      });
    } else {
      // Sum GMV across all items in the order
      existing.gmv += venda.actual_amount || 0;
      // MAX commission per order - Shopee reports total order commission on EACH item row
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
  // Filter out cancelled orders BEFORE aggregation to match Shopee panel logic
  // Use status first, then order_status as fallback (matches RPC logic)
  const validVendas = vendas.filter(v => {
    const status = v.status || v.order_status;
    if (!status) return true; // Include if no status
    const normalizedStatus = status.toUpperCase();
    // Exclude cancelled orders
    return !['CANCELLED', 'CANCELADO'].includes(normalizedStatus);
  });

  const orders = aggregateByOrder(validVendas);

  const totalGMV = orders.reduce((sum, order) => sum + order.gmv, 0);
  const netCommission = orders.reduce((sum, order) => sum + order.netCommission, 0);
  const totalOrders = orders.length;
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
export function groupByBrazilDay(vendas: ShopeeVenda[]): Map<string, { gmv: number; commission: number; orders: number }> {
  // Filter out cancelled orders BEFORE aggregation to match Shopee panel logic
  const validVendas = vendas.filter(v => {
    const status = v.status || v.order_status;
    if (!status) return true;
    const normalizedStatus = status.toUpperCase();
    return !['CANCELLED', 'CANCELADO'].includes(normalizedStatus);
  });

  const orders = aggregateByOrder(validVendas);
  const dayMap = new Map<string, { gmv: number; commission: number; orders: number }>();

  for (const order of orders) {
    if (!order.brazilDay) continue;

    const existing = dayMap.get(order.brazilDay);
    if (!existing) {
      dayMap.set(order.brazilDay, {
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
