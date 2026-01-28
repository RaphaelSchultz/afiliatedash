import { useEffect, useState, useMemo, useCallback } from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Receipt, Wallet, TrendingDown } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DayKPICards } from '@/components/day-analysis/DayKPICards';
import { UnifiedTable, type AggregatedRow } from '@/components/day-analysis/UnifiedTable';
import { SubIDTable } from '@/components/day-analysis/SubIDTable';
import { InvestmentModal, type InvestmentData } from '@/components/day-analysis/InvestmentModal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SEM_SUB_ID } from '@/lib/subIdUtils';
import type { VisibleColumns } from '@/components/day-analysis/ColumnToggleMenu';

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

  // Default to last 30 days (same as Dashboard) for Day Analysis
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const thirtyDaysAgo = useMemo(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'), []);

  const filterConfig = useMemo(() => ({
    defaultStart: thirtyDaysAgo,
    defaultEnd: today
  }), [thirtyDaysAgo, today]);

  const { filters, setFilters, brazilQueryDates } = useFilters(filterConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [rpcStats, setRpcStats] = useState<{
    totalSales: number;
    totalCommission: number;
    totalOrders: number;
  } | null>(null);
  
  // Server-side aggregated data for UnifiedTable
  const [unifiedTableData, setUnifiedTableData] = useState<AggregatedRow[]>([]);
  const [isUnifiedTableLoading, setIsUnifiedTableLoading] = useState(true);
  
  // Track visible columns for server-side re-aggregation
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    sub2: true,
    sub3: true,
    sub4: false,
    sub5: false,
    totalValue: true,
    quantity: false,
    investment: true,
    profit: true,
    roi: true
  });
  
  // Server-side aggregated table data for SubIDTables
  const [serverTableData, setServerTableData] = useState<{
    sub1: SubIDData[];
    sub2: SubIDData[];
    sub3: SubIDData[];
    sub4: SubIDData[];
    sub5: SubIDData[];
    channel: SubIDData[];
    status: SubIDData[];
  } | null>(null);

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

  // Map filter values for RPC (convert SEM_SUB_ID to __NULL__)
  const mapSubIdFilter = useCallback((arr: string[]) => 
    arr.length > 0 ? arr.map(v => v === SEM_SUB_ID ? '__NULL__' : v) : null, []);

  // Fetch KPIs and SubID table data
  useEffect(() => {
    if (!user) return;

    const fetchKPIsAndTables = async () => {
      setIsLoading(true);

      const startISO = brazilQueryDates.startISO;
      const endISO = brazilQueryDates.endISO;

      // 1. Fetch KPIs from RPC (Source of Truth for accurate totals)
      const { data: kpiData, error: kpiError } = await supabase.rpc('get_dashboard_kpis', {
        p_start_date: startISO,
        p_end_date: endISO,
        p_status: filters.status.length > 0 ? filters.status : null,
        p_channels: filters.channels.length > 0 ? filters.channels : null,
        p_sub_id1: mapSubIdFilter(filters.subId1),
        p_sub_id2: mapSubIdFilter(filters.subId2),
        p_sub_id3: mapSubIdFilter(filters.subId3),
        p_sub_id4: mapSubIdFilter(filters.subId4),
        p_sub_id5: mapSubIdFilter(filters.subId5),
      });

      if (kpiData && kpiData.length > 0) {
        const kpi = kpiData[0];
        setRpcStats({
          totalSales: Number(kpi.total_gmv) || 0,
          totalCommission: Number(kpi.net_commission) || 0,
          totalOrders: Number(kpi.total_orders) || 0
        });
      } else {
        setRpcStats(null);
      }

      if (kpiError) console.error('KPI RPC Error:', kpiError);

      // 2. Fetch aggregated table data from RPC for SubIDTables
      const { data: aggData, error: aggError } = await supabase.rpc('get_day_analysis_aggregations', {
        p_start_date: startISO,
        p_end_date: endISO,
        p_status: filters.status.length > 0 ? filters.status : null,
        p_channels: filters.channels.length > 0 ? filters.channels : null,
        p_sub_id1: mapSubIdFilter(filters.subId1),
        p_sub_id2: mapSubIdFilter(filters.subId2),
        p_sub_id3: mapSubIdFilter(filters.subId3),
        p_sub_id4: mapSubIdFilter(filters.subId4),
        p_sub_id5: mapSubIdFilter(filters.subId5),
      });

      if (aggData) {
        const data = aggData as unknown as {
          sub1: { key: string; total_commission: number; count: number }[];
          sub2: { key: string; total_commission: number; count: number }[];
          sub3: { key: string; total_commission: number; count: number }[];
          sub4: { key: string; total_commission: number; count: number }[];
          sub5: { key: string; total_commission: number; count: number }[];
          channel: { key: string; total_commission: number; count: number }[];
          status: { key: string; total_commission: number; count: number }[];
        };
        
        const parseAgg = (arr: { key: string; total_commission: number; count: number }[]): SubIDData[] => 
          (arr || []).map(item => ({
            key: item.key || 'Sem Sub ID',
            totalCommission: Number(item.total_commission) || 0,
            count: Number(item.count) || 0
          }));
        
        setServerTableData({
          sub1: parseAgg(data.sub1),
          sub2: parseAgg(data.sub2),
          sub3: parseAgg(data.sub3),
          sub4: parseAgg(data.sub4),
          sub5: parseAgg(data.sub5),
          channel: parseAgg(data.channel),
          status: parseAgg(data.status),
        });
      } else {
        setServerTableData(null);
      }

      if (aggError) console.error('Aggregation RPC Error:', aggError);

      setIsLoading(false);
    };

    fetchKPIsAndTables();
  }, [user, filters, brazilQueryDates, mapSubIdFilter]);

  // Fetch UnifiedTable data (re-fetches when visible columns change)
  useEffect(() => {
    if (!user) return;

    const fetchUnifiedTableData = async () => {
      setIsUnifiedTableLoading(true);

      const startISO = brazilQueryDates.startISO;
      const endISO = brazilQueryDates.endISO;

      const { data: unifiedData, error: unifiedError } = await supabase.rpc('get_unified_table_aggregations', {
        p_start_date: startISO,
        p_end_date: endISO,
        p_status: filters.status.length > 0 ? filters.status : null,
        p_channels: filters.channels.length > 0 ? filters.channels : null,
        p_sub_id1: mapSubIdFilter(filters.subId1),
        p_sub_id2: mapSubIdFilter(filters.subId2),
        p_sub_id3: mapSubIdFilter(filters.subId3),
        p_sub_id4: mapSubIdFilter(filters.subId4),
        p_sub_id5: mapSubIdFilter(filters.subId5),
        p_include_sub2: visibleColumns.sub2,
        p_include_sub3: visibleColumns.sub3,
        p_include_sub4: visibleColumns.sub4,
        p_include_sub5: visibleColumns.sub5,
      });

      if (unifiedData) {
        const rows = (unifiedData as unknown as Array<{
          rowKey: string;
          sub1: string;
          sub2: string;
          sub3: string;
          sub4: string;
          sub5: string;
          totalValue: number;
          quantity: number;
          commission: number;
        }>);
        
        setUnifiedTableData(rows.map(r => ({
          rowKey: r.rowKey,
          sub1: r.sub1,
          sub2: r.sub2,
          sub3: r.sub3,
          sub4: r.sub4,
          sub5: r.sub5,
          totalValue: Number(r.totalValue) || 0,
          quantity: Number(r.quantity) || 0,
          commission: Number(r.commission) || 0,
        })));
      } else {
        setUnifiedTableData([]);
      }

      if (unifiedError) console.error('UnifiedTable RPC Error:', unifiedError);

      setIsUnifiedTableLoading(false);
    };

    fetchUnifiedTableData();
  }, [user, filters, brazilQueryDates, visibleColumns, mapSubIdFilter]);

  // Handle column visibility changes from UnifiedTable
  const handleVisibleColumnsChange = useCallback((cols: VisibleColumns) => {
    setVisibleColumns(prev => {
      // Only update if the SubID columns changed (to trigger re-aggregation)
      if (prev.sub2 !== cols.sub2 || prev.sub3 !== cols.sub3 || 
          prev.sub4 !== cols.sub4 || prev.sub5 !== cols.sub5) {
        return cols;
      }
      return prev;
    });
  }, []);

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
    const newPerSubId = { ...(investmentData.perSubId || {}) };
    newPerSubId[subIdKey] = value;

    setInvestmentData({
      mode: 'perSubId',
      perSubId: newPerSubId
    });
  };

  // Calculate ROI stats for non-grouped mode
  const roiStats = useMemo(() => {
    let totalInvestment = 0;

    if (investmentData.mode === 'total') {
      totalInvestment = investmentData.total || 0;
    } else if (investmentData.mode === 'perSubId') {
      const perSubId = investmentData.perSubId || {};
      Object.values(perSubId).forEach(inv => {
        if (inv > 0) totalInvestment += inv;
      });
    }

    const commission = rpcStats?.totalCommission || 0;
    const profit = commission - totalInvestment;
    const roi = totalInvestment > 0 ? profit / totalInvestment : 0;

    return { totalInvestment, profit, roi };
  }, [investmentData, rpcStats]);

  // Table data for SubIDTables
  const tableData = useMemo(() => {
    if (serverTableData) {
      return serverTableData;
    }

    return {
      sub1: [],
      sub2: [],
      sub3: [],
      sub4: [],
      sub5: [],
      channel: [],
      status: [],
    };
  }, [serverTableData]);

  // Generate KPI Cards
  const kpiCards = useMemo(() => {
    // Use RPC Stats as the Source of Truth when available
    const displayStats = {
      totalSales: rpcStats?.totalSales || unifiedTableStats.totalSales,
      totalCommission: rpcStats?.totalCommission || unifiedTableStats.totalCommission,
      totalOrders: rpcStats?.totalOrders || unifiedTableStats.totalOrders,
      avgTicket: rpcStats ? (rpcStats.totalOrders > 0 ? rpcStats.totalSales / rpcStats.totalOrders : 0) : unifiedTableStats.avgTicket
    };

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
  }, [rpcStats, investmentData, roiStats, unifiedTableStats, isGroupedAnalysisMode]);

  const handleInvestmentSave = (data: InvestmentData) => {
    setInvestmentData(data);
  };

  const handleUnifiedStatsChange = useCallback((stats: UnifiedTableStats) => {
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

  const hasData = rpcStats && rpcStats.totalOrders > 0;

  return (
    <DashboardLayout filterConfig={filterConfig}>
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
              data={unifiedTableData}
              isLoading={isUnifiedTableLoading}
              onStatsChange={handleUnifiedStatsChange}
              onlyWithInvestment={onlyWithInvestment}
              onVisibleColumnsChange={handleVisibleColumnsChange}
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
        {!isLoading && !hasData && (
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
