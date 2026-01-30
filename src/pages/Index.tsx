import { useEffect, useState, useCallback } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Receipt, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard, KPICardSkeleton } from '@/components/dashboard/KPICard';
import { SubIdChart } from '@/components/dashboard/SubIdChart';
import { ChannelDonutChart } from '@/components/dashboard/ChannelDonutChart';
import { StatusCommissionChart } from '@/components/dashboard/StatusCommissionChart';
import { CommissionEvolutionChart } from '@/components/dashboard/CommissionEvolutionChart';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { SEM_SUB_ID } from '@/lib/subIdUtils';

// KPIs are now calculated server-side via RPC

type ShopeeVenda = Tables<'shopee_vendas'>;

interface DashboardKPIs {
  totalGMV: number;
  netCommission: number;
  totalOrders: number;
  avgTicket: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { filters, brazilQueryDates } = useFilters();

  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [aggregations, setAggregations] = useState({
    sub1: [],
    sub2: [],
    sub3: [],
    channel: [],
    status: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vendas, setVendas] = useState<ShopeeVenda[]>([]);
  const [hasAnyData, setHasAnyData] = useState<boolean | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalGMV: 0,
    netCommission: 0,
    totalOrders: 0,
    avgTicket: 0,
  });

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!user) return;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Prepare status filter for RPC
      const statusArray = filters.status.length > 0 ? (filters.status.includes('Cancelled') ? [...filters.status, 'UNPAID'] : filters.status) : null;
      const channelsArray = filters.channels.length > 0 ? filters.channels : null;

      // Prepare SubID filters - convert SEM_SUB_ID to __NULL__ for RPC
      const prepareSubIdFilter = (arr: string[]) => {
        if (arr.length === 0) return null;
        return arr.map(v => v === SEM_SUB_ID ? '__NULL__' : v);
      };

      // Check if user has ANY data in database (only on initial load)
      if (hasAnyData === null) {
        const { count } = await supabase
          .from('shopee_vendas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .limit(1);
        setHasAnyData((count ?? 0) > 0);
      }

      // Fetch KPIs from server-side RPC (no 1000 row limit)
      const { data: kpiData, error: kpiError } = await supabase
        .rpc('get_dashboard_kpis', {
          p_start_date: brazilQueryDates.startISO,
          p_end_date: brazilQueryDates.endISO,
          p_status: statusArray,
          p_channels: channelsArray,
          p_sub_id1: prepareSubIdFilter(filters.subId1),
          p_sub_id2: prepareSubIdFilter(filters.subId2),
          p_sub_id3: prepareSubIdFilter(filters.subId3),
          p_sub_id4: prepareSubIdFilter(filters.subId4),
          p_sub_id5: prepareSubIdFilter(filters.subId5),
        });

      if (kpiError) {
        console.error('KPI RPC error:', kpiError);
        throw kpiError;
      }

      // Update KPIs from server response
      if (kpiData && kpiData.length > 0) {
        const serverKpis = kpiData[0];
        setKpis({
          totalGMV: Number(serverKpis.total_gmv) || 0,
          netCommission: Number(serverKpis.net_commission) || 0,
          totalOrders: Number(serverKpis.total_orders) || 0,
          avgTicket: Number(serverKpis.avg_ticket) || 0,
        });
      }

      // 1. Fetch Aggregations (SubIDs, Channels, Status) via RPC
      const { data: aggData, error: aggError } = await supabase
        .rpc('get_day_analysis_aggregations', {
          p_start_date: brazilQueryDates.startISO,
          p_end_date: brazilQueryDates.endISO,
          p_status: statusArray,
          p_channels: channelsArray,
          p_sub_id1: prepareSubIdFilter(filters.subId1),
          p_sub_id2: prepareSubIdFilter(filters.subId2),
          p_sub_id3: prepareSubIdFilter(filters.subId3),
          p_sub_id4: prepareSubIdFilter(filters.subId4),
          p_sub_id5: prepareSubIdFilter(filters.subId5),
        });

      if (aggError) {
        console.error('Aggregations RPC error:', aggError);
      } else {
        setAggregations(aggData as any);
      }

      // 2. Fetch Evolution Data via RPC (get_relatorio_financeiro_br)
      // Note: This RPC returns daily commissions and GMV
      const { data: evoData, error: evoError } = await supabase
        .rpc('get_relatorio_financeiro_br', {
          data_inicio: brazilQueryDates.startISO,
          data_fim: brazilQueryDates.endISO
        });

      if (evoError) {
        console.error('Evolution RPC error:', evoError);
      } else {
        setEvolutionData(evoData || []);
      }

      setHasAnyData(true); // Should rely on actual count but assuming logic holds for now

      if (isManualRefresh) {
        toast({
          title: "Dados atualizados",
          description: `KPIs calculados com precisão`,
        });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (isManualRefresh) {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível carregar os dados",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, filters, brazilQueryDates]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>

        {/* KPI Cards - 4 columns */}
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
                title="Vendas Totais"
                value={formatCurrency(kpis.totalGMV)}
                icon={DollarSign}
                className="animate-slide-up"
              />
              <KPICard
                title="Comissão Líquida"
                value={formatCurrency(kpis.netCommission)}
                subtitle="Total gerado"
                icon={TrendingUp}
                className="animate-slide-up"
                style={{ animationDelay: '50ms' }}
              />
              <KPICard
                title="Pedidos"
                value={kpis.totalOrders.toLocaleString('pt-BR')}
                subtitle="Volume vendas"
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

        {/* Top SubIDs Row - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <SubIdChart
              data={aggregations.sub1}
              subIdField="sub_id1"
              title="Top SubID 1 (Comissão)"
              isLoading={isLoading}
              color="green"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <SubIdChart
              data={aggregations.sub2}
              subIdField="sub_id2"
              title="Top SubID 2 (Comissão)"
              isLoading={isLoading}
              color="orange"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <SubIdChart
              data={aggregations.sub3}
              subIdField="sub_id3"
              title="Top SubID 3 (Comissão)"
              isLoading={isLoading}
              color="purple"
            />
          </div>
        </div>

        {/* Channel and Status Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
            <ChannelDonutChart data={aggregations.channel} isLoading={isLoading} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <StatusCommissionChart data={aggregations.status} isLoading={isLoading} />
          </div>
        </div>

        {/* Commission Evolution - Full width */}
        <div className="animate-slide-up" style={{ animationDelay: '450ms' }}>
          <CommissionEvolutionChart data={evolutionData} isLoading={isLoading} />
        </div>

        {/* Empty State - Only show if user has NO data at all */}
        {!isLoading && evolutionData.length === 0 && hasAnyData === false && (
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