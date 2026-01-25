import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Receipt, Wallet, TrendingDown } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DayKPICards } from '@/components/day-analysis/DayKPICards';
import { UnifiedTable } from '@/components/day-analysis/UnifiedTable';
import { SubIDTable } from '@/components/day-analysis/SubIDTable';
import { InvestmentModal, type InvestmentData } from '@/components/day-analysis/InvestmentModal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { SEM_SUB_ID } from '@/lib/subIdUtils';
import { calculateKPIs, VALID_ORDER_STATUSES } from '@/lib/dashboardCalculations';

type ShopeeVenda = Tables<'shopee_vendas'>;

interface UnifiedTableStats {
  totalInvestment: number;
  totalProfit: number;
  hasInvestment: boolean;
  totalSales: number;
  totalCommission: number;
  totalOrders: number;
  avgTicket: number;
}

interface SubIDData {
  key: string;
  totalCommission: number;
  count: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function DayAnalysis() {
  const { user } = useAuth();
  const { filters, setFilters, brazilQueryDates } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [vendas, setVendas] = useState<ShopeeVenda[]>([]);
  
  // Investment state
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    mode: 'none',
    total: 0,
    perSubId: {}
  });
  
  // UI state
  const [isGroupedAnalysisMode, setIsGroupedAnalysisMode] = useState(true);
  const [onlyWithInvestment, setOnlyWithInvestment] = useState(false);
  const [unifiedTableStats, setUnifiedTableStats] = useState<UnifiedTableStats>({
    totalInvestment: 0,
    totalProfit: 0,
    hasInvestment: false,
    totalSales: 0,
    totalCommission: 0,
    totalOrders: 0,
    avgTicket: 0
  });

  // Fetch data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      let query = supabase
        .from('shopee_vendas')
        .select('*')
        .eq('user_id', user.id)
        .gte('purchase_time', brazilQueryDates.startISO)
        .lte('purchase_time', brazilQueryDates.endISO);

      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.channels.length > 0) {
        query = query.in('channel', filters.channels);
      }

      // Apply SubID filters
      if (filters.subId1.length > 0) {
        const hasNull = filters.subId1.includes(SEM_SUB_ID);
        const nonNullValues = filters.subId1.filter(v => v !== SEM_SUB_ID);
        if (hasNull && nonNullValues.length > 0) {
          query = query.or(`sub_id1.is.null,sub_id1.in.(${nonNullValues.join(',')})`);
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
          query = query.or(`sub_id2.is.null,sub_id2.in.(${nonNullValues.join(',')})`);
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
          query = query.or(`sub_id3.is.null,sub_id3.in.(${nonNullValues.join(',')})`);
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
          query = query.or(`sub_id4.is.null,sub_id4.in.(${nonNullValues.join(',')})`);
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
          query = query.or(`sub_id5.is.null,sub_id5.in.(${nonNullValues.join(',')})`);
        } else if (hasNull) {
          query = query.is('sub_id5', null);
        } else {
          query = query.in('sub_id5', nonNullValues);
        }
      }

      const { data } = await query;
      setVendas(data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [user, filters, brazilQueryDates]);

  // Handle table row click to filter data
  const handleTableRowClick = (keyField: string, value: string) => {
    if (!value || value === '—' || value === 'Sem Sub ID') return;

    if (keyField === 'channel') {
      setFilters({
        channels: filters.channels.includes(value)
          ? filters.channels.filter(c => c !== value)
          : [...filters.channels, value]
      });
    } else if (keyField === 'status') {
      setFilters({
        status: filters.status.includes(value)
          ? filters.status.filter(s => s !== value)
          : [...filters.status, value]
      });
    } else if (keyField === 'sub1') {
      setFilters({
        subId1: filters.subId1.includes(value)
          ? filters.subId1.filter(s => s !== value)
          : [...filters.subId1, value]
      });
    } else if (keyField === 'sub2') {
      setFilters({
        subId2: filters.subId2.includes(value)
          ? filters.subId2.filter(s => s !== value)
          : [...filters.subId2, value]
      });
    } else if (keyField === 'sub3') {
      setFilters({
        subId3: filters.subId3.includes(value)
          ? filters.subId3.filter(s => s !== value)
          : [...filters.subId3, value]
      });
    } else if (keyField === 'sub4') {
      setFilters({
        subId4: filters.subId4.includes(value)
          ? filters.subId4.filter(s => s !== value)
          : [...filters.subId4, value]
      });
    } else if (keyField === 'sub5') {
      setFilters({
        subId5: filters.subId5.includes(value)
          ? filters.subId5.filter(s => s !== value)
          : [...filters.subId5, value]
      });
    }
  };

  // Handle investment update with smart propagation
  const handleInvestmentUpdate = (subIdKey: string, value: number) => {
    // Find all orders that contain this SubID
    const relatedOrders = vendas.filter(order =>
      order.sub_id1 === subIdKey ||
      order.sub_id2 === subIdKey ||
      order.sub_id3 === subIdKey ||
      order.sub_id4 === subIdKey ||
      order.sub_id5 === subIdKey
    );

    // Collect all unique SubIDs from these orders
    const relatedSubIds = new Set<string>();
    relatedOrders.forEach(order => {
      if (order.sub_id1 && order.sub_id1 !== 'Sem Sub ID') relatedSubIds.add(order.sub_id1);
      if (order.sub_id2 && order.sub_id2 !== 'Sem Sub ID') relatedSubIds.add(order.sub_id2);
      if (order.sub_id3 && order.sub_id3 !== 'Sem Sub ID') relatedSubIds.add(order.sub_id3);
      if (order.sub_id4 && order.sub_id4 !== 'Sem Sub ID') relatedSubIds.add(order.sub_id4);
      if (order.sub_id5 && order.sub_id5 !== 'Sem Sub ID') relatedSubIds.add(order.sub_id5);
    });

    // Update investment for ALL related SubIDs
    const newPerSubId = { ...(investmentData.perSubId || {}) };
    relatedSubIds.forEach(subId => {
      newPerSubId[subId] = value;
    });

    setInvestmentData({
      mode: 'perSubId',
      perSubId: newPerSubId
    });
  };

  // Filter data based on investment toggle
  const filteredData = useMemo(() => {
    if (!onlyWithInvestment) return vendas;
    if (investmentData.mode === 'total') return vendas;
    if (investmentData.mode === 'none') return vendas;

    const perSubId = investmentData.perSubId || {};
    return vendas.filter(r => {
      const hasInvestment = (
        (r.sub_id1 && perSubId[r.sub_id1] > 0) ||
        (r.sub_id2 && perSubId[r.sub_id2] > 0) ||
        (r.sub_id3 && perSubId[r.sub_id3] > 0) ||
        (r.sub_id4 && perSubId[r.sub_id4] > 0) ||
        (r.sub_id5 && perSubId[r.sub_id5] > 0)
      );
      return hasInvestment;
    });
  }, [vendas, onlyWithInvestment, investmentData]);

  // Calculate base stats
  const baseStats = useMemo(() => {
    const kpis = calculateKPIs(filteredData);
    return {
      totalSales: kpis.totalGMV,
      totalCommission: kpis.netCommission,
      totalOrders: kpis.totalOrders,
      avgTicket: kpis.avgTicket
    };
  }, [filteredData]);

  // Calculate ROI stats
  const roiStats = useMemo(() => {
    let totalInvestment = 0;

    if (investmentData.mode === 'total') {
      totalInvestment = investmentData.total || 0;
    } else if (investmentData.mode === 'perSubId') {
      const perSubId = investmentData.perSubId || {};
      // Sum unique investments based on orders
      const countedSubIds = new Set<string>();
      filteredData.forEach(order => {
        [order.sub_id1, order.sub_id2, order.sub_id3, order.sub_id4, order.sub_id5].forEach(subId => {
          if (subId && perSubId[subId] > 0 && !countedSubIds.has(subId)) {
            totalInvestment += perSubId[subId];
            countedSubIds.add(subId);
          }
        });
      });
    }

    const profit = baseStats.totalCommission - totalInvestment;
    const roi = totalInvestment > 0 ? profit / totalInvestment : 0;

    return { totalInvestment, profit, roi };
  }, [investmentData, filteredData, baseStats]);

  // Table data aggregation
  const tableData = useMemo(() => {
    const aggregateByKey = (keyField: keyof ShopeeVenda): SubIDData[] => {
      const map = new Map<string, SubIDData>();
      filteredData.forEach(r => {
        const key = (r[keyField] as string) || 'Sem Sub ID';
        if (!map.has(key)) {
          map.set(key, { key, totalCommission: 0, count: 0 });
        }
        const entry = map.get(key)!;
        entry.totalCommission += r.net_commission || 0;
        entry.count += 1;
      });
      return Array.from(map.values()).sort((a, b) => b.totalCommission - a.totalCommission);
    };

    return {
      sub1: aggregateByKey('sub_id1'),
      sub2: aggregateByKey('sub_id2'),
      sub3: aggregateByKey('sub_id3'),
      sub4: aggregateByKey('sub_id4'),
      sub5: aggregateByKey('sub_id5'),
      channel: aggregateByKey('channel'),
      status: aggregateByKey('status'),
    };
  }, [filteredData]);

  // Generate KPI Cards - uses unifiedTableStats when in grouped mode, which respects onlyWithInvestment filter
  const kpiCards = useMemo(() => {
    // When in grouped mode, use stats from UnifiedTable (which already filters by investment if needed)
    // When NOT in grouped mode, use baseStats (which comes from filteredData that respects onlyWithInvestment)
    const displayStats = isGroupedAnalysisMode 
      ? unifiedTableStats 
      : baseStats;

    const cards = [
      {
        label: "Vendas Totais",
        value: formatCurrency(displayStats.totalSales),
        subtext: "Total em vendas",
        icon: TrendingUp,
        color: "from-blue-500 to-cyan-500"
      },
      {
        label: "Pedidos",
        value: displayStats.totalOrders,
        subtext: "Volume vendas",
        icon: ShoppingCart,
        color: "from-purple-500 to-pink-500"
      },
      {
        label: "Comissão Líquida",
        value: formatCurrency(displayStats.totalCommission),
        subtext: "Total gerado",
        icon: DollarSign,
        color: "from-green-500 to-emerald-500"
      },
      {
        label: "Ticket Médio",
        value: formatCurrency(displayStats.avgTicket),
        subtext: "Por pedido",
        icon: Receipt,
        color: "from-orange-500 to-yellow-500"
      }
    ];

    // Get investment values based on mode
    let displayInvestment = 0;
    let displayHasInvestment = false;

    if (isGroupedAnalysisMode) {
      displayInvestment = unifiedTableStats.totalInvestment;
      displayHasInvestment = unifiedTableStats.hasInvestment;
    } else {
      displayInvestment = roiStats.totalInvestment;
      displayHasInvestment = investmentData.mode !== 'none' && roiStats.totalInvestment > 0;
    }

    const displayProfit = displayStats.totalCommission - displayInvestment;

    if (displayHasInvestment) {
      cards.push({
        label: "Investimento em Ads",
        value: formatCurrency(displayInvestment),
        subtext: "Total investido",
        icon: Wallet,
        color: "from-yellow-500 to-orange-500"
      });
    }

    if (displayHasInvestment) {
      cards.push({
        label: "Lucro Total",
        value: formatCurrency(displayProfit),
        subtext: displayProfit >= 0 ? "Resultado positivo" : "Resultado negativo",
        icon: displayProfit >= 0 ? TrendingUp : TrendingDown,
        color: displayProfit >= 0 ? "from-green-500 to-emerald-500" : "from-red-500 to-pink-500"
      });
    }

    if (displayHasInvestment) {
      const finalRoi = displayInvestment > 0 ? (displayProfit / displayInvestment) : 0;
      cards.push({
        label: "ROI",
        value: finalRoi.toFixed(2) + 'x',
        subtext: finalRoi >= 1 ? "Retorno positivo" : "Abaixo do investido",
        icon: finalRoi >= 0 ? TrendingUp : TrendingDown,
        color: finalRoi >= 0 ? "from-blue-500 to-cyan-500" : "from-red-500 to-orange-500"
      });
    }

    return cards;
  }, [baseStats, investmentData, roiStats, unifiedTableStats, isGroupedAnalysisMode]);

  const handleInvestmentSave = (data: InvestmentData) => {
    setInvestmentData(data);
  };

  const handleUnifiedStatsChange = useMemo(() => (stats: UnifiedTableStats) => {
    setUnifiedTableStats(prev => {
      if (prev.totalInvestment === stats.totalInvestment &&
          prev.totalProfit === stats.totalProfit &&
          prev.hasInvestment === stats.hasInvestment &&
          prev.totalSales === stats.totalSales &&
          prev.totalCommission === stats.totalCommission &&
          prev.totalOrders === stats.totalOrders &&
          prev.avgTicket === stats.avgTicket) {
        return prev;
      }
      return stats;
    });
  }, []);

  // Check if has any investment
  const hasAnyInvestment = isGroupedAnalysisMode 
    ? unifiedTableStats.hasInvestment 
    : (investmentData.mode === 'perSubId' && Object.values(investmentData.perSubId || {}).some(v => v > 0));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análise do Dia</h1>
            <p className="text-muted-foreground">Cálculo de ROI e performance de anúncios</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Only with investment toggle */}
            {hasAnyInvestment && (
              <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-4 py-2">
                <Label htmlFor="only-investment" className="text-sm text-muted-foreground font-medium cursor-pointer">
                  Apenas com Investimento
                </Label>
                <Switch
                  id="only-investment"
                  checked={onlyWithInvestment}
                  onCheckedChange={setOnlyWithInvestment}
                />
              </div>
            )}

            {/* Grouped Analysis Toggle */}
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-4 py-2">
              <Label htmlFor="grouped-mode" className="text-sm text-muted-foreground font-medium cursor-pointer">
                Análise Agrupada
              </Label>
              <Switch
                id="grouped-mode"
                checked={isGroupedAnalysisMode}
                onCheckedChange={setIsGroupedAnalysisMode}
              />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <DayKPICards stats={kpiCards} isLoading={isLoading} />

        {/* Unified Table - Show ONLY if Grouped Mode is ON */}
        {isGroupedAnalysisMode && (
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <UnifiedTable
              data={filteredData}
              onStatsChange={handleUnifiedStatsChange}
              onlyWithInvestment={onlyWithInvestment}
            />
          </div>
        )}

        {/* SubID Tables - Show ONLY if Grouped Mode is OFF */}
        {!isGroupedAnalysisMode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <SubIDTable
              data={tableData.sub1}
              title="Comissões por Sub ID 1"
              keyField="sub1"
              investmentData={investmentData}
              onRowClick={(value) => handleTableRowClick('sub1', value)}
              onInvestmentChange={handleInvestmentUpdate}
            />
            <SubIDTable
              data={tableData.sub2}
              title="Comissões por Sub ID 2"
              keyField="sub2"
              investmentData={investmentData}
              onRowClick={(value) => handleTableRowClick('sub2', value)}
              onInvestmentChange={handleInvestmentUpdate}
            />
            <SubIDTable
              data={tableData.sub3}
              title="Comissões por Sub ID 3"
              keyField="sub3"
              investmentData={investmentData}
              onRowClick={(value) => handleTableRowClick('sub3', value)}
              onInvestmentChange={handleInvestmentUpdate}
            />
            <SubIDTable
              data={tableData.sub4}
              title="Comissões por Sub ID 4"
              keyField="sub4"
              investmentData={investmentData}
              onRowClick={(value) => handleTableRowClick('sub4', value)}
              onInvestmentChange={handleInvestmentUpdate}
            />
            <SubIDTable
              data={tableData.sub5}
              title="Comissões por Sub ID 5"
              keyField="sub5"
              investmentData={investmentData}
              onRowClick={(value) => handleTableRowClick('sub5', value)}
              onInvestmentChange={handleInvestmentUpdate}
            />
            <SubIDTable
              data={tableData.channel}
              title="Comissões por Canal"
              keyField="channel"
              investmentData={investmentData}
              onRowClick={(value) => handleTableRowClick('channel', value)}
              onInvestmentChange={handleInvestmentUpdate}
            />
            <SubIDTable
              data={tableData.status}
              title="Comissões por Status"
              keyField="status"
              investmentData={investmentData}
              onRowClick={(value) => handleTableRowClick('status', value)}
              onInvestmentChange={handleInvestmentUpdate}
            />
          </div>
        )}

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
              Faça upload de seus relatórios CSV para começar a analisar suas vendas.
              Ajuste os filtros de data se necessário.
            </p>
          </div>
        )}
      </div>

      <InvestmentModal
        isOpen={investmentModalOpen}
        onClose={() => setInvestmentModalOpen(false)}
        onSave={handleInvestmentSave}
        initialData={investmentData}
      />
    </DashboardLayout>
  );
}
