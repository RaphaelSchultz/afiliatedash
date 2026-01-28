import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ShopeeVenda } from '@/lib/supabase';
import { groupByBrazilDay } from '@/lib/dashboardCalculations';

const COLORS = [
  'hsl(24, 100%, 50%)',   // Primary orange
  'hsl(173, 80%, 40%)',   // Teal
  'hsl(262, 83%, 58%)',   // Purple
  'hsl(199, 89%, 48%)',   // Blue
  'hsl(43, 96%, 56%)',    // Yellow
  'hsl(4, 90%, 58%)',     // Red
];

interface ChartProps {
  data: ShopeeVenda[];
  isLoading?: boolean;
}

export function CommissionLineChart({ data, isLoading }: ChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Use Brazil timezone (UTC-3) for grouping
    const salesByDay = groupByBrazilDay(data);
    
    return Array.from(salesByDay.entries())
      .map(([date, values]) => ({
        date: format(new Date(date), 'dd/MM'),
        sortKey: date,
        commission: values.commission,
        gmv: values.gmv,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!chartData.length) {
    return <EmptyChart message="Sem dados de comissão" />;
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Evolução de Comissões</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
              tickFormatter={(value) => `R$${value.toFixed(0)}`}
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
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Comissão']}
            />
            <Line
              type="monotone"
              dataKey="commission"
              stroke="hsl(24, 100%, 50%)"
              strokeWidth={3}
              dot={{ fill: 'hsl(24, 100%, 50%)', strokeWidth: 2 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ChannelDonutChart({ data, isLoading }: ChartProps) {
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
    return <ChartSkeleton />;
  }

  if (!chartData.length) {
    return <EmptyChart message="Sem dados por canal" />;
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Vendas por Canal</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
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
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'GMV']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span style={{ color: 'hsl(215, 20%, 65%)' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopSubIDsChart({ data, isLoading }: ChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const grouped = data.reduce((acc, item) => {
      const subId = item.sub_id1 || 'Sem SubID';
      if (!acc[subId]) {
        acc[subId] = { subId, gmv: 0, commission: 0 };
      }
      acc[subId].gmv += item.actual_amount || 0;
      acc[subId].commission += item.net_commission || 0;
      return acc;
    }, {} as Record<string, { subId: string; gmv: number; commission: number }>);

    return Object.values(grouped)
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 10);
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!chartData.length) {
    return <EmptyChart message="Sem dados de SubID" />;
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Top SubIDs (Campanhas)</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
            <XAxis 
              type="number" 
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
              tickFormatter={(value) => `R$${value.toFixed(0)}`}
            />
            <YAxis 
              dataKey="subId" 
              type="category" 
              stroke="hsl(215, 20%, 65%)"
              fontSize={11}
              width={100}
              tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
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
              formatter={(value: number, name: string) => [
                `R$ ${value.toFixed(2)}`,
                name === 'gmv' ? 'GMV' : 'Comissão'
              ]}
            />
            <Bar dataKey="gmv" fill="hsl(24, 100%, 50%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatusBarChart({ data, isLoading }: ChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const grouped = data.reduce((acc, item) => {
      const status = item.status || 'Desconhecido';
      if (!acc[status]) {
        acc[status] = { status, count: 0, gmv: 0 };
      }
      acc[status].count += 1;
      acc[status].gmv += item.actual_amount || 0;
      return acc;
    }, {} as Record<string, { status: string; count: number; gmv: number }>);

    return Object.values(grouped);
  }, [data]);

  const statusColors: Record<string, string> = {
    'Completed': 'hsl(142, 76%, 36%)',
    'Pending': 'hsl(38, 92%, 50%)',
    'Cancelled': 'hsl(0, 84%, 60%)',
  };

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!chartData.length) {
    return <EmptyChart message="Sem dados de status" />;
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Status dos Pedidos</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
            <XAxis 
              dataKey="status" 
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
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
              formatter={(value: number, name: string) => [
                name === 'count' ? value : `R$ ${value.toFixed(2)}`,
                name === 'count' ? 'Pedidos' : 'GMV'
              ]}
            />
            <Legend 
              formatter={(value) => (
                <span style={{ color: 'hsl(215, 20%, 65%)' }}>
                  {value === 'count' ? 'Pedidos' : 'GMV'}
                </span>
              )}
            />
            <Bar dataKey="count" fill="hsl(24, 100%, 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="h-4 w-32 bg-muted rounded animate-pulse mb-4" />
      <div className="h-[300px] bg-muted/30 rounded-xl animate-pulse" />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
