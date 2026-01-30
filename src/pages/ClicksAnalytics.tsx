import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MousePointerClick, Globe, Link2, TrendingUp } from 'lucide-react';
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
  BarChart,
  Bar
} from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = [
  'hsl(24, 100%, 50%)',
  'hsl(173, 80%, 40%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(43, 96%, 56%)',
];

// RPC Response Type
type ShopeeClicksDashboard = {
  summary: {
    total_clicks: number;
    unique_regions: number;
    unique_referrers: number;
    unique_subids: number;
  };
  evolution: {
    dia: string;
    total_clicks: number;
  }[];
  regions: {
    key: string;
    count: number;
  }[];
  referrers: {
    key: string;
    count: number;
  }[];
  subids: {
    key: string;
    count: number;
  }[];
};

export default function ClicksAnalytics() {
  const { user } = useAuth();
  const { filters } = useFilters();

  // Fetch Dashboard Data via RPC
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['shopee-clicks-dashboard', filters.startDate, filters.endDate],
    queryFn: async () => {
      if (!filters.startDate || !filters.endDate) return null;

      const { data, error } = await supabase.rpc('get_shopee_clicks_dashboard', {
        p_start_date: filters.startDate,
        p_end_date: filters.endDate + 'T23:59:59' // Ensure end of day
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      return data as ShopeeClicksDashboard;
    },
    enabled: !!user,
  });

  // Prepare Chart Data (Evolution)
  const chartData = useMemo(() => {
    if (!analytics?.evolution) return [];
    return analytics.evolution.map(item => ({
      date: format(parseISO(item.dia), 'dd/MM'), // Format for display
      fullDate: item.dia, // Keep original for sorting if needed
      clicks: item.total_clicks
    }));
  }, [analytics?.evolution]);

  // Prepare Region Data
  const regionData = useMemo(() => {
    return analytics?.regions.map(r => ({ name: r.key, value: r.count })) || [];
  }, [analytics?.regions]);

  // Prepare Top Referrers
  const topReferrers = useMemo(() => {
    return analytics?.referrers.map(r => ({ referrer: r.key, clicks: r.count })) || [];
  }, [analytics?.referrers]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Análise de Cliques (Shopee)
          </h1>
          <p className="text-muted-foreground">
            Métricas de tráfego e performance dos seus links importados.
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
                value={(analytics?.summary.total_clicks || 0).toLocaleString('pt-BR')}
                icon={MousePointerClick}
                className="animate-slide-up"
              />
              <KPICard
                title="Regiões"
                value={analytics?.summary.unique_regions || 0}
                icon={Globe}
                className="animate-slide-up"
                style={{ animationDelay: '50ms' }}
              />
              <KPICard
                title="Origens"
                value={analytics?.summary.unique_referrers || 0}
                icon={Link2}
                className="animate-slide-up"
                style={{ animationDelay: '100ms' }}
              />
              <KPICard
                title="Campanhas (SubIDs)"
                value={analytics?.summary.unique_subids || 0}
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
