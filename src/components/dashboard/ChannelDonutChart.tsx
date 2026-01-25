import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="40%"
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
                backgroundColor: 'hsl(222, 47%, 11%)',
                border: '1px solid hsl(222, 30%, 20%)',
                borderRadius: '12px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'GMV']}
            />
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ right: 0, paddingLeft: 20 }}
              formatter={(value, entry: any) => (
                <span className="text-xs text-muted-foreground">
                  {value}
                  <br />
                  <span className="text-foreground font-medium">
                    {formatCurrency(entry.payload.value)}
                  </span>
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}