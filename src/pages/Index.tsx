import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Receipt } from 'lucide-react';
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

import { calculateKPIs } from '@/lib/dashboardCalculations';

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
  const [vendas, setVendas] = useState<ShopeeVenda[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs>({
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
        // Fetch raw vendas for charts and KPIs
        // This ensures KPIs respect the same filters (status, subId, etc.) as the charts
        let query = supabase
          .from('shopee_vendas')
          .select('*')
          .eq('user_id', user.id)
          .gte('purchase_time', brazilQueryDates.startISO)
          .lte('purchase_time', brazilQueryDates.endISO);

        if (filters.status.length > 0) {
          // Map UI status to DB status (handle translation + case sensitivity)
          const mappedStatus = filters.status.flatMap(s => {
            // Normalize to common format
            const status = s.toLowerCase();

            if (status === 'pendente' || status === 'pending') return ['PENDING', 'Pending'];
            if (status === 'concluído' || status === 'completed') return ['COMPLETED', 'Completed'];
            if (status === 'cancelado' || status === 'cancelled') return ['CANCELLED', 'Cancelled'];

            // Fallback: use exact value + uppercase version
            return [s, s.toUpperCase()];
          });

          query = query.in('status', mappedStatus);
        }

        if (filters.channels.length > 0) {
          query = query.in('channel', filters.channels);
        }

        // Apply SubID filters with isolated column logic
        // Each filter applies ONLY to its specific column
        if (filters.subId1.length > 0) {
          const hasNull = filters.subId1.includes(SEM_SUB_ID);
          const nonNullValues = filters.subId1.filter(v => v !== SEM_SUB_ID);

          if (hasNull && nonNullValues.length > 0) {
            // Fix: properly quote values for the raw OR syntax
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
          throw error;
        }

        setVendas(vendasData || []);

        // Calculate KPIs client-side to ensure match with charts
        if (vendasData) {
          const newKpis = calculateKPIs(vendasData);
          setKpis(newKpis);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, filters, brazilQueryDates]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
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