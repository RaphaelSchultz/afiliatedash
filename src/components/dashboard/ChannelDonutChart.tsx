import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Tables } from '@/integrations/supabase/types';

type ShopeeVenda = Tables<'shopee_vendas'>;

interface ChannelDonutChartProps {
  data: ShopeeVenda[];
  isLoading?: boolean;
}

const COLORS = [
  'hsl(220, 70%, 55%)',   // Blue
  'hsl(24, 100%, 50%)',   // Orange
  'hsl(142, 76%, 45%)',   // Green
  'hsl(270, 80%, 60%)',   // Purple
  'hsl(43, 96%, 56%)',    // Yellow
  'hsl(173, 80%, 40%)',   // Teal
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function ChannelDonutChart({ data, isLoading }: ChannelDonutChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const grouped = data.reduce((acc, item) => {
      const channel = item.channel || 'Não identificado';
      if (!acc[channel]) {
        acc[channel] = { name: channel, value: 0 };
      }
      acc[channel].value += item.actual_amount || 0;
      return acc;
    }, {} as Record<string, { name: string; value: number }>);

    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [data]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="h-4 w-32 bg-muted rounded animate-pulse mb-4" />
        <div className="h-[280px] bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Por Canal</h3>
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Sem dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Por Canal</h3>
      <div className="flex items-center gap-4 h-[280px]">
        {/* Chart Area */}
        <div className="flex-1 h-full min-w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatCurrency(value), 'GMV']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend Area with Scroll */}
        <div className="w-[180px] h-full overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-3">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground truncate" title={entry.name}>
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground pl-5">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}