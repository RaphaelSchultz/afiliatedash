import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MousePointerClick, Globe, Smartphone, Monitor, TrendingUp } from 'lucide-react';
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
  Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface LinkAnalytic {
  id: string;
  link_id: string;
  device: string | null;
  region: string | null;
  country: string | null;
  channel: string | null;
  referrer: string | null;
  created_at: string;
}

interface LinkInfo {
  id: string;
  name: string;
  slug: string;
  clicks_count: number;
}

const COLORS = [
  'hsl(24, 100%, 50%)',
  'hsl(173, 80%, 40%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(43, 96%, 56%)',
];

export default function LinksAnalytics() {
  const { user } = useAuth();
  const { filters } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<LinkAnalytic[]>([]);
  const [links, setLinks] = useState<LinkInfo[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch user's links
      const { data: linksData } = await supabase
        .from('links')
        .select('id, name, slug, clicks_count')
        .order('clicks_count', { ascending: false });

      setLinks(linksData || []);

      // Fetch analytics for all user's links
      if (linksData && linksData.length > 0) {
        const linkIds = linksData.map(l => l.id);
        
        const { data: analyticsData } = await supabase
          .from('link_analytics')
          .select('*')
          .in('link_id', linkIds)
          .gte('created_at', filters.startDate)
          .lte('created_at', filters.endDate + 'T23:59:59')
          .order('created_at', { ascending: false });

        setAnalytics(analyticsData || []);
      } else {
        setAnalytics([]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user, filters]);

  // Calculate metrics
  const totalClicks = analytics.length;
  const uniqueRegions = new Set(analytics.map(a => a.region).filter(Boolean)).size;
  const mobileClicks = analytics.filter(a => a.device?.toLowerCase().includes('mobile')).length;
  const desktopClicks = analytics.filter(a => a.device?.toLowerCase().includes('desktop')).length;

  // Clicks by day
  const clicksByDay = analytics.reduce((acc, item) => {
    if (!item.created_at) return acc;
    const date = format(parseISO(item.created_at), 'dd/MM');
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

  // Device stats
  const deviceStats = analytics.reduce((acc, item) => {
    const device = item.device || 'Desconhecido';
    if (!acc[device]) {
      acc[device] = { name: device, value: 0 };
    }
    acc[device].value += 1;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);

  const deviceData = Object.values(deviceStats)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Channel/referrer stats
  const channelStats = analytics.reduce((acc, item) => {
    const channel = item.channel || item.referrer || 'Direto';
    if (!acc[channel]) {
      acc[channel] = { name: channel, value: 0 };
    }
    acc[channel].value += 1;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);

  const channelData = Object.values(channelStats)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Region stats
  const regionStats = analytics.reduce((acc, item) => {
    const region = item.region || 'Desconhecida';
    if (!acc[region]) {
      acc[region] = { name: region, value: 0 };
    }
    acc[region].value += 1;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);

  const regionData = Object.values(regionStats)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Top links by clicks in period
  const linkClicksInPeriod = analytics.reduce((acc, item) => {
    if (!acc[item.link_id]) {
      acc[item.link_id] = 0;
    }
    acc[item.link_id] += 1;
    return acc;
  }, {} as Record<string, number>);

  const topLinks = links
    .map(link => ({
      ...link,
      periodClicks: linkClicksInPeriod[link.id] || 0,
    }))
    .sort((a, b) => b.periodClicks - a.periodClicks)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Analytics de Links
          </h1>
          <p className="text-muted-foreground">
            Métricas detalhadas de todos os seus links encurtados.
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
                title="Mobile"
                value={mobileClicks.toLocaleString('pt-BR')}
                icon={Smartphone}
                className="animate-slide-up"
                style={{ animationDelay: '100ms' }}
              />
              <KPICard
                title="Desktop"
                value={desktopClicks.toLocaleString('pt-BR')}
                icon={Monitor}
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
                      <linearGradient id="colorLinksClicks" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorLinksClicks)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados de cliques no período
              </div>
            )}
          </div>

          {/* Device distribution */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Dispositivos</h3>
            {isLoading ? (
              <div className="h-[300px] bg-muted/30 rounded-xl animate-pulse" />
            ) : deviceData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((_, index) => (
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
                Sem dados de dispositivos
              </div>
            )}
          </div>
        </div>

        {/* Channels / Referrers */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Canais de Origem</h3>
          {isLoading ? (
            <div className="h-[250px] bg-muted/30 rounded-xl animate-pulse" />
          ) : channelData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
                  <XAxis type="number" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fontSize: 12, fill: 'hsl(215, 20%, 65%)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 11%)',
                      border: '1px solid hsl(222, 30%, 20%)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(24, 100%, 50%)" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Sem dados de canais
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Links */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Links (Período)</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topLinks.length > 0 ? (
              <div className="space-y-3">
                {topLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-medium text-foreground block">{link.name}</span>
                        <span className="text-xs text-muted-foreground">/r/{link.slug}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{link.periodClicks.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-muted-foreground">cliques</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum link encontrado</p>
            )}
          </div>

          {/* Top Regions */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Regiões</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : regionData.length > 0 ? (
              <div className="space-y-3">
                {regionData.slice(0, 5).map((region, index) => (
                  <div
                    key={region.name}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">{region.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{region.value.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-muted-foreground">cliques</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados de regiões</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
