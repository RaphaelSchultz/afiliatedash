import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SubIDData {
  key: string;
  totalCommission: number;
  count: number;
}

interface InvestmentData {
  mode: 'none' | 'total' | 'perSubId';
  total?: number;
  perSubId?: Record<string, number>;
}

interface SubIDTableProps {
  data: SubIDData[];
  title: string;
  keyField: string;
  investmentData: InvestmentData;
  onRowClick?: (value: string) => void;
  onInvestmentChange?: (key: string, value: number) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function TableRow({ 
  row, 
  keyField, 
  investmentData, 
  onClick, 
  onInvestmentChange 
}: {
  row: SubIDData;
  keyField: string;
  investmentData: InvestmentData;
  onClick?: (value: string) => void;
  onInvestmentChange?: (key: string, value: number) => void;
}) {
  const { key, totalCommission } = row;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Calculate investment for this key
  let investment = 0;
  if (investmentData && investmentData.mode !== 'none') {
    if (investmentData.mode === 'perSubId') {
      investment = investmentData.perSubId?.[key] || 0;
    }
  }

  const profit = totalCommission - investment;
  const roi = investment > 0 ? (profit / investment) : 0;
  const hasInvestment = investment > 0;

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedValue = investment > 0 ? investment.toFixed(2).replace('.', ',') : '';
    setEditValue(formattedValue);
    setIsEditing(true);
  };

  const handleSave = () => {
    const cleanValue = editValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(cleanValue) || 0;
    if (onInvestmentChange) {
      onInvestmentChange(key, value);
    }
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

  const getKeyLabel = () => {
    if (keyField === 'sub1') return 'SUB ID 1';
    if (keyField === 'sub2') return 'SUB ID 2';
    if (keyField === 'sub3') return 'SUB ID 3';
    if (keyField === 'sub4') return 'SUB ID 4';
    if (keyField === 'sub5') return 'SUB ID 5';
    if (keyField === 'channel') return 'CANAL';
    return 'STATUS';
  };

  return (
    <tr
      onClick={() => onClick?.(key)}
      className={cn(
        "hover:bg-white/5 transition-colors",
        onClick && "cursor-pointer"
      )}
    >
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
        {key}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-400">
        {formatCurrency(totalCommission)}
      </td>
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
            <span>{hasInvestment ? formatCurrency(investment) : '—'}</span>
            <button
              onClick={handleEditStart}
              className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Editar investimento"
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}
      </td>
      <td className={cn(
        "px-4 py-3 whitespace-nowrap text-sm text-right font-semibold",
        profit >= 0 ? "text-green-400" : "text-red-400"
      )}>
        {hasInvestment ? formatCurrency(profit) : formatCurrency(totalCommission)}
      </td>
      <td className={cn(
        "px-4 py-3 whitespace-nowrap text-sm text-right font-semibold",
        roi >= 0 ? "text-blue-400" : "text-red-400"
      )}>
        {hasInvestment ? roi.toFixed(2) + 'x' : '—'}
      </td>
    </tr>
  );
}

export function SubIDTable({ 
  data, 
  title, 
  keyField, 
  investmentData, 
  onRowClick, 
  onInvestmentChange 
}: SubIDTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <p className="text-muted-foreground text-sm text-center py-8">Nenhum dado disponível</p>
      </div>
    );
  }

  const getKeyLabel = () => {
    if (keyField === 'sub1') return 'SUB ID 1';
    if (keyField === 'sub2') return 'SUB ID 2';
    if (keyField === 'sub3') return 'SUB ID 3';
    if (keyField === 'sub4') return 'SUB ID 4';
    if (keyField === 'sub5') return 'SUB ID 5';
    if (keyField === 'channel') return 'CANAL';
    return 'STATUS';
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:border-primary/20 transition-all">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <ScrollArea className="max-h-[400px]">
        <table className="w-full">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {getKeyLabel()}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Comissão Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Gasto em Anúncios
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Lucro
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                ROI
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, index) => (
              <TableRow
                key={`${row.key}-${index}`}
                row={row}
                keyField={keyField}
                investmentData={investmentData}
                onClick={onRowClick}
                onInvestmentChange={onInvestmentChange}
              />
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
