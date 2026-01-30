import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { useFilters, Filters } from '@/hooks/useFilters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { normalizeSubIdForDisplay, subIdFieldToFilterKey, type SubIdField } from '@/lib/subIdUtils';

interface AggregationItem {
  key: string;
  total_commission: number;
  count: number;
}

interface SubIdChartProps {
  data: AggregationItem[];
  subIdField: SubIdField;
  title: string;
  isLoading?: boolean;
  color?: string;
}

const COLORS = [
  'hsl(142, 76%, 45%)',   // Green
  'hsl(142, 70%, 50%)',
  'hsl(142, 65%, 55%)',
  'hsl(142, 60%, 60%)',
  'hsl(142, 55%, 65%)',
  'hsl(142, 50%, 70%)',
  'hsl(142, 45%, 75%)',
  'hsl(142, 40%, 80%)',
];

const COLORS_ORANGE = [
  'hsl(24, 100%, 50%)',
  'hsl(24, 95%, 55%)',
  'hsl(24, 90%, 60%)',
  'hsl(24, 85%, 65%)',
  'hsl(24, 80%, 70%)',
];

const COLORS_PURPLE = [
  'hsl(270, 80%, 60%)',
  'hsl(270, 75%, 65%)',
  'hsl(270, 70%, 70%)',
  'hsl(270, 65%, 75%)',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SubIdChart({ data, subIdField, title, isLoading, color = 'green' }: SubIdChartProps) {
  const { filters, setFilters } = useFilters();

  const chartData = useMemo(() => {
    if (!data || !data.length) return [];

    return data.map((item) => ({
      name: normalizeSubIdForDisplay(item.key === '__NULL__' || item.key === 'Sem Sub ID' ? null : item.key),
      commission: Number(item.total_commission),
    }));
  }, [data]);

  const colors = color === 'green' ? COLORS : color === 'orange' ? COLORS_ORANGE : COLORS_PURPLE;

  // Handle bar click to apply filter
  const handleBarClick = (data: any) => {
    if (!data || !data.name) return;

    const filterKey = subIdFieldToFilterKey[subIdField];
    const currentValues = filters[filterKey] as string[];

    // Toggle the filter value
    const newValues = currentValues.includes(data.name)
      ? currentValues.filter((v) => v !== data.name)
      : [...currentValues, data.name];

    setFilters({ [filterKey]: newValues });
  };

  // Check if a bar is currently filtered
  const isFiltered = (name: string) => {
    const filterKey = subIdFieldToFilterKey[subIdField];
    const currentValues = filters[filterKey] as string[];
    return currentValues.includes(name);
  };

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
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">{title}</h3>
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Sem dados</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic height based on data count (min 280px, 28px per bar)
  const chartHeight = Math.max(280, chartData.length * 28);
  const needsScroll = chartHeight > 280;

  const chart = (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 0, right: 60 }}
      >
        <XAxis
          type="number"
          hide
        />
        <YAxis
          dataKey="name"
          type="category"
          stroke="hsl(215, 20%, 65%)"
          fontSize={11}
          width={150}
          tickFormatter={(value) => value.length > 25 ? `${value.slice(0, 25)}...` : value}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          wrapperClassName="chart-tooltip"
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, hsl(var(--card)))',
            border: '1px solid var(--tooltip-border, hsl(var(--border)))',
            borderRadius: '12px',
            color: 'hsl(var(--foreground))',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: number) => [formatCurrency(value), 'Comissão']}
          cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Bar
          dataKey="commission"
          radius={[0, 4, 4, 0]}
          barSize={20}
          onClick={handleBarClick}
          style={{ cursor: 'pointer' }}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              opacity={isFiltered(entry.name) ? 1 : 0.85}
            />
          ))}
          <LabelList
            dataKey="commission"
            position="right"
            formatter={(value: number) => formatCurrency(value)}
            style={{
              fill: 'hsl(215, 20%, 65%)',
              fontSize: 10,
              fontWeight: 500,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">{title}</h3>
      {needsScroll ? (
        <ScrollArea className="h-[280px]">
          {chart}
        </ScrollArea>
      ) : (
        <div className="h-[280px]">
          {chart}
        </div>
      )}
    </div>
  );
}