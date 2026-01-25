import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Receipt } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard, KPICardSkeleton } from '@/components/dashboard/KPICard';
import {
  CommissionLineChart,
  ChannelDonutChart,
  TopSubIDsChart,
  StatusBarChart,
} from '@/components/dashboard/Charts';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type ShopeeVenda = Tables<'shopee_vendas'>;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { filters } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [vendas, setVendas] = useState<ShopeeVenda[]>([]);
  const [kpis, setKpis] = useState({
    totalGMV: 0,
    netCommission: 0,
    totalOrders: 0,
    avgTicket: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        let query = supabase
          .from('shopee_vendas')
          .select('*')
          .eq('user_id', user.id)
          .gte('purchase_time', filters.startDate)
          .lte('purchase_time', filters.endDate + 'T23:59:59');

        if (filters.status.length > 0) {
          query = query.in('status', filters.status);
        }

        if (filters.channels.length > 0) {
          query = query.in('channel', filters.channels);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching vendas:', error);
          toast({
            title: 'Erro ao carregar dados',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        const vendasData = data || [];
        setVendas(vendasData);

        // Calculate KPIs
        const totalGMV = vendasData.reduce((sum, v) => sum + (v.actual_amount || 0), 0);
        const netCommission = vendasData.reduce((sum, v) => sum + (v.net_commission || 0), 0);
        const uniqueOrders = new Set(vendasData.map((v) => v.order_id)).size;
        const avgTicket = uniqueOrders > 0 ? totalGMV / uniqueOrders : 0;

        setKpis({
          totalGMV,
          netCommission,
          totalOrders: uniqueOrders,
          avgTicket,
        });
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, filters]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral das suas vendas e comissões da Shopee.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                title="Vendas Totais (GMV)"
                value={formatCurrency(kpis.totalGMV)}
                icon={DollarSign}
                className="animate-slide-up"
              />
              <KPICard
                title="Comissão Líquida"
                value={formatCurrency(kpis.netCommission)}
                icon={TrendingUp}
                className="animate-slide-up"
                style={{ animationDelay: '50ms' }}
              />
              <KPICard
                title="Total de Pedidos"
                value={kpis.totalOrders.toLocaleString('pt-BR')}
                icon={ShoppingCart}
                className="animate-slide-up"
                style={{ animationDelay: '100ms' }}
              />
              <KPICard
                title="Ticket Médio"
                value={formatCurrency(kpis.avgTicket)}
                icon={Receipt}
                className="animate-slide-up"
                style={{ animationDelay: '150ms' }}
              />
            </>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CommissionLineChart data={vendas} isLoading={isLoading} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <ChannelDonutChart data={vendas} isLoading={isLoading} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <TopSubIDsChart data={vendas} isLoading={isLoading} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
            <StatusBarChart data={vendas} isLoading={isLoading} />
          </div>
        </div>

        {/* Empty State */}
        {!isLoading && vendas.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Faça upload de seus relatórios CSV para começar a visualizar suas métricas.
              Ajuste os filtros de data se necessário.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
