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

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vendas, setVendas] = useState<ShopeeVenda[]>([]);
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
      const statusArray = filters.status.length > 0 ? filters.status : null;
      const channelsArray = filters.channels.length > 0 ? filters.channels : null;
      
      // Prepare SubID filters - convert SEM_SUB_ID to __NULL__ for RPC
      const prepareSubIdFilter = (arr: string[]) => {
        if (arr.length === 0) return null;
        return arr.map(v => v === SEM_SUB_ID ? '__NULL__' : v);
      };

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

      // Fetch data for charts (limited sample for visualization)
      let query = supabase
        .from('shopee_vendas')
        .select('*')
        .eq('user_id', user.id)
        .gte('purchase_time', brazilQueryDates.startISO)
        .lte('purchase_time', brazilQueryDates.endISO)
        .limit(5000); // Increased limit for charts

      if (filters.status.length > 0) {
        const mappedStatus = filters.status.flatMap(s => {
          const status = s.toLowerCase();
          if (status === 'pendente' || status === 'pending') return ['PENDING', 'Pending'];
          if (status === 'concluído' || status === 'completed') return ['COMPLETED', 'Completed'];
          if (status === 'cancelado' || status === 'cancelled') return ['CANCELLED', 'Cancelled'];
          return [s, s.toUpperCase()];
        });
        query = query.in('status', mappedStatus);
      }

      if (filters.channels.length > 0) {
        query = query.in('channel', filters.channels);
      }
      // Apply SubID filters for chart data
      if (filters.subId1.length > 0) {
        const hasNull = filters.subId1.includes(SEM_SUB_ID);
        const nonNullValues = filters.subId1.filter(v => v !== SEM_SUB_ID);
        if (hasNull && nonNullValues.length > 0) {
          const valuesList = nonNullValues.map(v => `"${v}"`).join(',');
          query = query.or(`sub_id1.is.null,sub_id1.in.(${valuesList})`);
        } else if (hasNull) {
          query = query.is('sub_id1', null);
        } else {
          query = query.in('sub_id1', nonNullValues);
        }
      }
      if (filters.subId2.length > 0) {
        const hasNull = filters.subId2.includes(SEM_SUB_ID);
        const nonNullValues = filters.subId2.filter(v => v !== SEM_SUB_ID);
        if (hasNull && nonNullValues.length > 0) {
          const valuesList = nonNullValues.map(v => `"${v}"`).join(',');
          query = query.or(`sub_id2.is.null,sub_id2.in.(${valuesList})`);
        } else if (hasNull) {
          query = query.is('sub_id2', null);
        } else {
          query = query.in('sub_id2', nonNullValues);
        }
      }
      if (filters.subId3.length > 0) {
        const hasNull = filters.subId3.includes(SEM_SUB_ID);
        const nonNullValues = filters.subId3.filter(v => v !== SEM_SUB_ID);
        if (hasNull && nonNullValues.length > 0) {
          const valuesList = nonNullValues.map(v => `"${v}"`).join(',');
          query = query.or(`sub_id3.is.null,sub_id3.in.(${valuesList})`);
        } else if (hasNull) {
          query = query.is('sub_id3', null);
        } else {
          query = query.in('sub_id3', nonNullValues);
        }
      }
      if (filters.subId4.length > 0) {
        const hasNull = filters.subId4.includes(SEM_SUB_ID);
        const nonNullValues = filters.subId4.filter(v => v !== SEM_SUB_ID);
        if (hasNull && nonNullValues.length > 0) {
          const valuesList = nonNullValues.map(v => `"${v}"`).join(',');
          query = query.or(`sub_id4.is.null,sub_id4.in.(${valuesList})`);
        } else if (hasNull) {
          query = query.is('sub_id4', null);
        } else {
          query = query.in('sub_id4', nonNullValues);
        }
      }
      if (filters.subId5.length > 0) {
        const hasNull = filters.subId5.includes(SEM_SUB_ID);
        const nonNullValues = filters.subId5.filter(v => v !== SEM_SUB_ID);
        if (hasNull && nonNullValues.length > 0) {
          const valuesList = nonNullValues.map(v => `"${v}"`).join(',');
          query = query.or(`sub_id5.is.null,sub_id5.in.(${valuesList})`);
        } else if (hasNull) {
          query = query.is('sub_id5', null);
        } else {
          query = query.in('sub_id5', nonNullValues);
        }
      }

      const { data: vendasData, error } = await query;

      if (error) {
        console.error('Chart data error:', error);
      }

      setVendas(vendasData || []);

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
              data={vendas}
              subIdField="sub_id1"
              title="Top SubID 1 (Comissão)"
              isLoading={isLoading}
              color="green"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <SubIdChart
              data={vendas}
              subIdField="sub_id2"
              title="Top SubID 2 (Comissão)"
              isLoading={isLoading}
              color="orange"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <SubIdChart
              data={vendas}
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
            <ChannelDonutChart data={vendas} isLoading={isLoading} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <StatusCommissionChart data={vendas} isLoading={isLoading} />
          </div>
        </div>

        {/* Commission Evolution - Full width */}
        <div className="animate-slide-up" style={{ animationDelay: '450ms' }}>
          <CommissionEvolutionChart data={vendas} isLoading={isLoading} />
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