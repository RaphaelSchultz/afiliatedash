import { useState, useEffect, useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ColumnToggleMenu, type VisibleColumns } from './ColumnToggleMenu';
import type { Tables } from '@/integrations/supabase/types';

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

interface UnifiedTableProps {
  data: ShopeeVenda[];
  onStatsChange?: (stats: UnifiedTableStats) => void;
  onlyWithInvestment?: boolean;
}

interface AggregatedRow {
  rowKey: string;
  sub1: string;
  sub2: string;
  sub3: string;
  sub4: string;
  sub5: string;
  totalValue: number;
  quantity: number;
  commission: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Row component with inline editing
function UnifiedTableRow({ 
  row, 
  visibleColumns, 
  investment, 
  onInvestmentChange 
}: {
  row: AggregatedRow;
  visibleColumns: VisibleColumns;
  investment: number;
  onInvestmentChange: (rowKey: string, value: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleEditStart = () => {
    const formattedValue = investment > 0 ? investment.toFixed(2).replace('.', ',') : '';
    setEditValue(formattedValue);
    setIsEditing(true);
  };

  const handleSave = () => {
    const cleanValue = editValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(cleanValue) || 0;
    onInvestmentChange(row.rowKey, value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }
    setEditValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const profit = row.commission - investment;
  const roi = investment > 0 ? (profit / investment) : 0;

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{row.sub1}</td>
      {visibleColumns.sub2 && (
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{row.sub2}</td>
      )}
      {visibleColumns.sub3 && (
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{row.sub3}</td>
      )}
      {visibleColumns.sub4 && (
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{row.sub4}</td>
      )}
      {visibleColumns.sub5 && (
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{row.sub5}</td>
      )}
      {visibleColumns.totalValue && (
        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-400">
          {formatCurrency(row.totalValue)}
        </td>
      )}
      {visibleColumns.quantity && (
        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-muted-foreground">
          {row.quantity}
        </td>
      )}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-400">
        {formatCurrency(row.commission)}
      </td>
      {visibleColumns.investment && (
        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-muted-foreground group relative">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <span className="text-muted-foreground">R$</span>
              <input
                type="text"
                value={editValue}
                onChange={handleInputChange}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-24 px-2 py-1 bg-background border border-primary/50 rounded text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                placeholder="0,00"
              />
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <span>{investment > 0 ? formatCurrency(investment) : '—'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditStart();
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Editar investimento"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </td>
      )}
      {visibleColumns.profit && (
        <td className={cn(
          "px-4 py-3 whitespace-nowrap text-sm text-right font-semibold",
          profit >= 0 ? "text-green-400" : "text-red-400"
        )}>
          {investment > 0 ? formatCurrency(profit) : formatCurrency(row.commission)}
        </td>
      )}
      {visibleColumns.roi && (
        <td className={cn(
          "px-4 py-3 whitespace-nowrap text-sm text-right font-semibold",
          roi >= 0 ? "text-blue-400" : "text-red-400"
        )}>
          {investment > 0 ? roi.toFixed(2) + 'x' : '—'}
        </td>
      )}
    </tr>
  );
}

export function UnifiedTable({ data, onStatsChange, onlyWithInvestment }: UnifiedTableProps) {
  const getDefaultColumns = (): VisibleColumns => {
    const saved = localStorage.getItem('unifiedTableColumns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved columns:', e);
      }
    }
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return {
      sub2: !isMobile,
      sub3: !isMobile,
      sub4: false,
      sub5: false,
      totalValue: !isMobile,
      quantity: false,
      investment: !isMobile,
      profit: !isMobile,
      roi: !isMobile
    };
  };

  const getDefaultInvestments = (): Record<string, number> => {
    const saved = localStorage.getItem('unifiedTableInvestments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved investments:', e);
      }
    }
    return {};
  };

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(getDefaultColumns);
  const [unifiedInvestments, setUnifiedInvestments] = useState<Record<string, number>>(getDefaultInvestments);

  useEffect(() => {
    localStorage.setItem('unifiedTableColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem('unifiedTableInvestments', JSON.stringify(unifiedInvestments));
  }, [unifiedInvestments]);

  const handleInvestmentUpdate = (rowKey: string, value: number) => {
    setUnifiedInvestments(prev => ({
      ...prev,
      [rowKey]: value
    }));
  };

  const handleToggleColumn = (columnKey: keyof VisibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const handleReset = () => {
    const defaults: VisibleColumns = {
      sub2: true,
      sub3: true,
      sub4: false,
      sub5: false,
      totalValue: true,
      quantity: false,
      investment: true,
      profit: true,
      roi: true
    };
    setVisibleColumns(defaults);
  };

  // Aggregate data based on visible columns
  const aggregatedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = new Map<string, AggregatedRow & { uniqueOrders: Set<string> }>();

    data.forEach(order => {
      const keyParts: string[] = [];
      const sub1 = order.sub_id1 || 'Sem Sub ID';
      const sub2 = order.sub_id2 || 'Sem Sub ID';
      const sub3 = order.sub_id3 || 'Sem Sub ID';
      const sub4 = order.sub_id4 || 'Sem Sub ID';
      const sub5 = order.sub_id5 || 'Sem Sub ID';

      if (sub1 !== 'Sem Sub ID') keyParts.push(sub1);
      if (visibleColumns.sub2 && sub2 !== 'Sem Sub ID') keyParts.push(sub2);
      if (visibleColumns.sub3 && sub3 !== 'Sem Sub ID') keyParts.push(sub3);
      if (visibleColumns.sub4 && sub4 !== 'Sem Sub ID') keyParts.push(sub4);
      if (visibleColumns.sub5 && sub5 !== 'Sem Sub ID') keyParts.push(sub5);

      const key = keyParts.length > 0 ? keyParts.join('|') : 'sem_sub_id';

      if (!grouped.has(key)) {
        grouped.set(key, {
          rowKey: key,
          sub1: key === 'sem_sub_id' ? 'Sem Sub IDs' : sub1,
          sub2: key === 'sem_sub_id' ? '-' : sub2,
          sub3: key === 'sem_sub_id' ? '-' : sub3,
          sub4: key === 'sem_sub_id' ? '-' : sub4,
          sub5: key === 'sem_sub_id' ? '-' : sub5,
          totalValue: 0,
          quantity: 0,
          commission: 0,
          uniqueOrders: new Set()
        });
      }

      const group = grouped.get(key)!;
      group.totalValue += order.actual_amount || 0;

      const oid = order.order_id;
      if (oid && !group.uniqueOrders.has(oid)) {
        group.uniqueOrders.add(oid);
        group.quantity += 1;
        group.commission += order.net_commission || 0;
      }
    });

    return Array.from(grouped.values())
      .map(({ uniqueOrders, ...rest }) => rest)
      .sort((a, b) => b.commission - a.commission);
  }, [data, visibleColumns.sub2, visibleColumns.sub3, visibleColumns.sub4, visibleColumns.sub5]);

  // Filter based on investment toggle
  const displayedData = useMemo(() => {
    if (!aggregatedData) return [];
    if (!onlyWithInvestment) return aggregatedData;

    return aggregatedData.filter(row => {
      const inv = unifiedInvestments[row.rowKey] || 0;
      return inv > 0;
    });
  }, [aggregatedData, onlyWithInvestment, unifiedInvestments]);

  // Calculate and propagate stats to parent
  useEffect(() => {
    if (!onStatsChange) return;

    let totalInv = 0;
    let totalProfit = 0;
    let hasInv = false;
    let totalSales = 0;
    let totalCommission = 0;
    let totalOrders = 0;

    displayedData?.forEach(row => {
      const inv = unifiedInvestments[row.rowKey] || 0;

      totalSales += row.totalValue || 0;
      totalCommission += row.commission || 0;
      totalOrders += row.quantity || 0;

      if (inv > 0) {
        totalInv += inv;
        totalProfit += (row.commission - inv);
        hasInv = true;
      }
    });

    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    onStatsChange({
      totalInvestment: totalInv,
      totalProfit,
      hasInvestment: hasInv,
      totalSales,
      totalCommission,
      totalOrders,
      avgTicket
    });
  }, [displayedData, unifiedInvestments, onStatsChange]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, onlyWithInvestment]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedData.slice(start, start + pageSize);
  }, [displayedData, currentPage]);

  const totalPages = Math.ceil((displayedData?.length || 0) / pageSize);

  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Análise Agrupada</h3>
          <ColumnToggleMenu
            visibleColumns={visibleColumns}
            onToggle={handleToggleColumn}
            onReset={handleReset}
          />
        </div>
        <p className="text-muted-foreground text-sm text-center py-8">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:border-primary/20 transition-all flex flex-col">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Análise Agrupada{' '}
          <span className="text-sm font-normal text-muted-foreground">
            ({displayedData.length} registros)
          </span>
        </h3>
        <ColumnToggleMenu
          visibleColumns={visibleColumns}
          onToggle={handleToggleColumn}
          onReset={handleReset}
        />
      </div>

      <ScrollArea className="flex-1 max-h-[600px]">
        <table className="w-full">
          <thead className="sticky top-0 bg-card z-10 shadow-sm">
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Sub ID 1</th>
              {visibleColumns.sub2 && (
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Sub ID 2</th>
              )}
              {visibleColumns.sub3 && (
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Sub ID 3</th>
              )}
              {visibleColumns.sub4 && (
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Sub ID 4</th>
              )}
              {visibleColumns.sub5 && (
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Sub ID 5</th>
              )}
              {visibleColumns.totalValue && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Valor Total</th>
              )}
              {visibleColumns.quantity && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Qtd Pedidos</th>
              )}
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Comissão Líquida</th>
              {visibleColumns.investment && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Gasto Anúncios</th>
              )}
              {visibleColumns.profit && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Lucro</th>
              )}
              {visibleColumns.roi && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">ROI</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedData?.map((row) => (
              <UnifiedTableRow
                key={row.rowKey}
                row={row}
                visibleColumns={visibleColumns}
                investment={unifiedInvestments[row.rowKey] || 0}
                onInvestmentChange={handleInvestmentUpdate}
              />
            ))}
          </tbody>
        </table>
      </ScrollArea>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página <span className="text-foreground font-medium">{currentPage}</span> de{' '}
            <span className="text-foreground font-medium">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-foreground hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-foreground hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
