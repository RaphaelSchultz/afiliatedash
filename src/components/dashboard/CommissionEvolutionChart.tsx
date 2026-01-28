import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import { groupByBrazilDay } from '@/lib/dashboardCalculations';

type ShopeeVenda = Tables<'shopee_vendas'>;

interface CommissionEvolutionChartProps {
  data: ShopeeVenda[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function CommissionEvolutionChart({ data, isLoading }: CommissionEvolutionChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const salesByDay = groupByBrazilDay(data);
    
    return Array.from(salesByDay.entries())
      .map(([date, values]) => ({
        date: format(new Date(date), 'dd/MM/yyyy', { locale: ptBR }),
        sortKey: date,
        commission: values.commission,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [data]);

  // Find max value for highlighting
  const maxPoint = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((max, point) => 
      point.commission > max.commission ? point : max
    , chartData[0]);
  }, [chartData]);

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
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider text-center">
          Evolução Comissões
        </h3>
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Sem dados de comissão</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider text-center">
        Evolução Comissões
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(215, 20%, 65%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 65%)"
              fontSize={11}
              tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [formatCurrency(value), 'Comissão']}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="commission"
              stroke="hsl(173, 80%, 40%)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(173, 80%, 40%)' }}
            />
            {maxPoint && (
              <ReferenceDot
                x={maxPoint.date}
                y={maxPoint.commission}
                r={6}
                fill="hsl(142, 76%, 45%)"
                stroke="hsl(142, 76%, 45%)"
                label={{
                  value: formatCurrency(maxPoint.commission),
                  position: 'top',
                  fill: 'hsl(142, 76%, 45%)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}