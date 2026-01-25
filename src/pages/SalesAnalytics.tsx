import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { BarChart3, TrendingUp, ShoppingBag, Store } from 'lucide-react';

type ShopeeVenda = Tables<'shopee_vendas'>;
import { KPICard, KPICardSkeleton } from '@/components/dashboard/KPICard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { calculateKPIs, groupByBrazilDay, aggregateByOrder, VALID_ORDER_STATUSES } from '@/lib/dashboardCalculations';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function SalesAnalytics() {
  const { user } = useAuth();
  const { filters, brazilQueryDates } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [vendas, setVendas] = useState<ShopeeVenda[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Use Brazil timezone (UTC-3) for date filtering
      let query = supabase
        .from('shopee_vendas')
        .select('*')
        .eq('user_id', user.id)
        .gte('purchase_time', brazilQueryDates.startISO)
        .lte('purchase_time', brazilQueryDates.endISO);

      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data } = await query;
      setVendas(data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [user, filters, brazilQueryDates]);

  // Calculate metrics using aligned logic
  const kpis = calculateKPIs(vendas);
  const orders = aggregateByOrder(vendas);
  const validOrders = orders.filter(o => o.status && VALID_ORDER_STATUSES.includes(o.status));
  const uniqueShops = new Set(vendas.map(v => v.shop_name).filter(Boolean)).size;

  // Sales by Brazil day (UTC-3) chart data
  const salesByDay = groupByBrazilDay(vendas);
  const chartData = Array.from(salesByDay.entries())
    .map(([date, data]) => ({
      date: format(new Date(date), 'dd/MM'),
      sortKey: date,
      gmv: data.gmv,
      commission: data.commission,
      orders: data.orders,
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Top shops
  const shopStats = vendas.reduce((acc, item) => {
    const shop = item.shop_name || 'Desconhecida';
    if (!acc[shop]) {
      acc[shop] = { shop, gmv: 0, orders: 0 };
    }
    acc[shop].gmv += item.actual_amount || 0;
    acc[shop].orders += 1;
    return acc;
  }, {} as Record<string, { shop: string; gmv: number; orders: number }>);

  const topShops = Object.values(shopStats)
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Análise de Vendas
          </h1>
          <p className="text-muted-foreground">
            Métricas detalhadas das suas vendas na Shopee.
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
                title="GMV Total"
                value={formatCurrency(kpis.totalGMV)}
                icon={BarChart3}
                className="animate-slide-up"
              />
              <KPICard
                title="Comissão Total"
                value={formatCurrency(kpis.netCommission)}
                icon={TrendingUp}
                className="animate-slide-up"
                style={{ animationDelay: '50ms' }}
              />
              <KPICard
                title="Pedidos"
                value={kpis.totalOrders.toLocaleString('pt-BR')}
                icon={ShoppingBag}
                className="animate-slide-up"
                style={{ animationDelay: '100ms' }}
              />
              <KPICard
                title="Lojas Únicas"
                value={uniqueShops.toLocaleString('pt-BR')}
                icon={Store}
                className="animate-slide-up"
                style={{ animationDelay: '150ms' }}
              />
            </>
          )}
        </div>

        {/* Sales Chart */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Vendas por Dia</h3>
          {isLoading ? (
            <div className="h-[350px] bg-muted/30 rounded-xl animate-pulse" />
          ) : chartData.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" />
                  <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 11%)',
                      border: '1px solid hsl(222, 30%, 20%)',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toFixed(2)}`,
                      name === 'gmv' ? 'GMV' : 'Comissão'
                    ]}
                  />
                  <Legend formatter={(v) => v === 'gmv' ? 'GMV' : 'Comissão'} />
                  <Bar dataKey="gmv" fill="hsl(24, 100%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commission" fill="hsl(173, 80%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </div>

        {/* Top Shops */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Lojas</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : topShops.length > 0 ? (
            <div className="space-y-3">
              {topShops.map((shop, index) => (
                <div
                  key={shop.shop}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{shop.shop}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(shop.gmv)}</p>
                    <p className="text-sm text-muted-foreground">{shop.orders} pedidos</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados de lojas</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
