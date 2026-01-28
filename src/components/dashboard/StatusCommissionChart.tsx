import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Tables } from '@/integrations/supabase/types';

type ShopeeVenda = Tables<'shopee_vendas'>;

interface StatusCommissionChartProps {
  data: ShopeeVenda[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'COMPLETED': 'hsl(173, 80%, 40%)',
  'Completed': 'hsl(173, 80%, 40%)',
  'Concluído': 'hsl(173, 80%, 40%)',
  'PENDING': 'hsl(43, 96%, 56%)',
  'Pending': 'hsl(43, 96%, 56%)',
  'Pendente': 'hsl(43, 96%, 56%)',
  'CANCELLED': 'hsl(0, 84%, 60%)',
  'Cancelled': 'hsl(0, 84%, 60%)',
  'Cancelado': 'hsl(0, 84%, 60%)',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function StatusCommissionChart({ data, isLoading }: StatusCommissionChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Aggregate by order_id first - use combined status (status OR order_status)
    const orderMap = new Map<string, { status: string; commission: number }>();

    for (const venda of data) {
      const orderId = venda.order_id;
      // Use status first, then order_status as fallback (matches RPC logic)
      const status = venda.status || venda.order_status || 'Desconhecido';
      
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          status,
          commission: venda.net_commission || 0,
        });
      } else {
        // Sum commission for multi-item orders
        const existing = orderMap.get(orderId)!;
        existing.commission += venda.net_commission || 0;
      }
    }

    // Group by status
    const grouped: Record<string, number> = {};
    for (const order of orderMap.values()) {
      if (!grouped[order.status]) {
        grouped[order.status] = 0;
      }
      grouped[order.status] += order.commission;
    }

    return Object.entries(grouped)
      .map(([status, commission]) => ({ status, commission }))
      .sort((a, b) => b.commission - a.commission);
  }, [data]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="h-4 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="h-[280px] bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Comissão por Status</h3>
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Sem dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Comissão por Status</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis 
              type="number" 
              hide
            />
            <YAxis 
              dataKey="status" 
              type="category" 
              stroke="hsl(215, 20%, 65%)"
              fontSize={11}
              width={90}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 11%)',
                border: '1px solid hsl(222, 30%, 20%)',
                borderRadius: '12px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Comissão']}
              cursor={{ fill: 'hsl(222, 30%, 15%)' }}
            />
            <Bar 
              dataKey="commission" 
              radius={[0, 4, 4, 0]}
              barSize={24}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status] || 'hsl(173, 80%, 40%)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}