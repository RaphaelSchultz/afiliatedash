import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MousePointerClick, TrendingUp, Smartphone, Monitor } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Link {
  id: string;
  name: string;
  slug: string;
  clicks_count: number;
}

interface LinkAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: Link;
}

interface AnalyticsData {
  id: string;
  device: string | null;
  region: string | null;
  country: string | null;
  channel: string | null;
  referrer: string | null;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444'];

export function LinkAnalyticsModal({ open, onOpenChange, link }: LinkAnalyticsModalProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['link-analytics', link.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_analytics')
        .select('*')
        .eq('link_id', link.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AnalyticsData[];
    },
    enabled: open,
  });

  // Process device data
  const deviceData = analytics ? (() => {
    const counts: Record<string, number> = {};
    analytics.forEach((item) => {
      const device = item.device || 'Desconhecido';
      counts[device] = (counts[device] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })() : [];

  // Process channel data
  const channelData = analytics ? (() => {
    const counts: Record<string, number> = {};
    analytics.forEach((item) => {
      const channel = item.channel || 'Direto';
      counts[channel] = (counts[channel] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  })() : [];

  // Process region data
  const regionData = analytics ? (() => {
    const counts: Record<string, number> = {};
    analytics.forEach((item) => {
      const region = item.region || 'Desconhecido';
      counts[region] = (counts[region] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  })() : [];

  // Find best channel
  const bestChannel = channelData.length > 0 ? channelData[0].name : 'N/A';

  // Count devices
  const mobileCount = deviceData.find(d => d.name.toLowerCase().includes('mobile'))?.value || 0;
  const desktopCount = deviceData.find(d => d.name.toLowerCase().includes('desktop'))?.value || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytics: {link.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Cliques</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{link.clicks_count}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Melhor Canal</span>
                  </div>
                  <p className="text-lg font-bold mt-1 truncate">{bestChannel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Mobile</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{mobileCount}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Desktop</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{desktopCount}</p>
                </CardContent>
              </Card>
            </div>

            {analytics && analytics.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Device Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dispositivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {deviceData.map((_, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Channel Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Canais de Origem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelData} layout="vertical">
                          <XAxis type="number" />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={80}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Bar 
                            dataKey="value" 
                            fill="hsl(var(--primary))" 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MousePointerClick className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sem dados ainda</h3>
                  <p className="text-muted-foreground">
                    Os dados de analytics aparecerão aqui quando seu link receber cliques.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Top Regions */}
            {regionData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Regiões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {regionData.map((region, index) => (
                      <div 
                        key={region.name} 
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <span>{region.name}</span>
                        </div>
                        <span className="font-semibold">{region.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
