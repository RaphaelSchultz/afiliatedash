import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { MousePointerClick, Globe, Link2, TrendingUp } from 'lucide-react';

type ShopeeClick = Tables<'shopee_clicks'>;
import { KPICard, KPICardSkeleton } from '@/components/dashboard/KPICard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = [
  'hsl(24, 100%, 50%)',
  'hsl(173, 80%, 40%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(43, 96%, 56%)',
];

export default function ClicksAnalytics() {
  const { user } = useAuth();
  const { filters } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [clicks, setClicks] = useState<ShopeeClick[]>([]);
  const [hasAnyData, setHasAnyData] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Check if user has ANY clicks data in database (only on initial load)
      if (hasAnyData === null) {
        const { count } = await supabase
          .from('shopee_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .limit(1);
        setHasAnyData((count ?? 0) > 0);
      }

      const { data } = await supabase
        .from('shopee_clicks')
        .select('*')
        .eq('user_id', user.id)
        .gte('click_time', filters.startDate)
        .lte('click_time', filters.endDate + 'T23:59:59');

      setClicks(data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [user, filters]);

  // Calculate metrics
  const totalClicks = clicks.length;
  const uniqueRegions = new Set(clicks.map(c => c.region).filter(Boolean)).size;
  const uniqueReferrers = new Set(clicks.map(c => c.referrer).filter(Boolean)).size;
  const uniqueSubIds = new Set(clicks.map(c => c.sub_id1).filter(Boolean)).size;

  // Clicks by day
  const clicksByDay = clicks.reduce((acc, item) => {
    if (!item.click_time) return acc;
    const date = format(parseISO(item.click_time), 'dd/MM');
    if (!acc[date]) {
      acc[date] = { date, clicks: 0 };
    }
    acc[date].clicks += 1;
    return acc;
  }, {} as Record<string, { date: string; clicks: number }>);

  const chartData = Object.values(clicksByDay).sort((a, b) => {
    const [dayA, monthA] = a.date.split('/').map(Number);
    const [dayB, monthB] = b.date.split('/').map(Number);
    return monthA - monthB || dayA - dayB;
  });

  // Clicks by region
  const regionStats = clicks.reduce((acc, item) => {
    const region = item.region || 'Desconhecida';
    if (!acc[region]) {
      acc[region] = { name: region, value: 0 };
    }
    acc[region].value += 1;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);

  const regionData = Object.values(regionStats)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Top referrers
  const referrerStats = clicks.reduce((acc, item) => {
    const referrer = item.referrer || 'Direto';
    if (!acc[referrer]) {
      acc[referrer] = { referrer, clicks: 0 };
    }
    acc[referrer].clicks += 1;
    return acc;
  }, {} as Record<string, { referrer: string; clicks: number }>);

  const topReferrers = Object.values(referrerStats)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Análise de Cliques
          </h1>
          <p className="text-muted-foreground">
            Métricas de tráfego e performance dos seus links.
          </p>
        </div>

        {/* KPIs */}
        <div className="flex flex-wrap gap-4">
          {isLoading ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : (
            <>
              <KPICard
                title="Total de Cliques"
                value={totalClicks.toLocaleString('pt-BR')}
                icon={MousePointerClick}
                className="animate-slide-up"
              />
              <KPICard
                title="Regiões"
                value={uniqueRegions}
                icon={Globe}
                className="animate-slide-up"
                style={{ animationDelay: '50ms' }}
              />
              <KPICard
                title="Origens"
                value={uniqueReferrers}
                icon={Link2}
                className="animate-slide-up"
                style={{ animationDelay: '100ms' }}
              />
              <KPICard
                title="Campanhas (SubIDs)"
                value={uniqueSubIds}
                icon={TrendingUp}
                className="animate-slide-up"
                style={{ animationDelay: '150ms' }}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clicks over time */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Cliques por Dia</h3>
            {isLoading ? (
              <div className="h-[300px] bg-muted/30 rounded-xl animate-pulse" />
            ) : chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 11%)',
                        border: '1px solid hsl(222, 30%, 20%)',
                        borderRadius: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(24, 100%, 50%)"
                      fillOpacity={1}
                      fill="url(#colorClicks)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados de cliques
              </div>
            )}
          </div>

          {/* Clicks by region */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Cliques por Região</h3>
            {isLoading ? (
              <div className="h-[300px] bg-muted/30 rounded-xl animate-pulse" />
            ) : regionData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {regionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 11%)',
                        border: '1px solid hsl(222, 30%, 20%)',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados de regiões
              </div>
            )}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Origens de Tráfego</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : topReferrers.length > 0 ? (
            <div className="space-y-3">
              {topReferrers.map((ref, index) => (
                <div
                  key={ref.referrer}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {ref.referrer}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{ref.clicks.toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-muted-foreground">cliques</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados de origens</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
