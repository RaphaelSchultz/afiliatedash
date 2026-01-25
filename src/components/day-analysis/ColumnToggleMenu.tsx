import { useState } from 'react';
import { Settings2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface VisibleColumns {
  sub2: boolean;
  sub3: boolean;
  sub4: boolean;
  sub5: boolean;
  totalValue: boolean;
  quantity: boolean;
  investment: boolean;
  profit: boolean;
  roi: boolean;
}

interface ColumnToggleMenuProps {
  visibleColumns: VisibleColumns;
  onToggle: (key: keyof VisibleColumns) => void;
  onReset: () => void;
}

const columnLabels: Record<keyof VisibleColumns, string> = {
  sub2: 'Sub ID 2',
  sub3: 'Sub ID 3',
  sub4: 'Sub ID 4',
  sub5: 'Sub ID 5',
  totalValue: 'Valor Total',
  quantity: 'Qtd Pedidos',
  investment: 'Investimento',
  profit: 'Lucro',
  roi: 'ROI',
};

export function ColumnToggleMenu({ visibleColumns, onToggle, onReset }: ColumnToggleMenuProps) {
  const [open, setOpen] = useState(false);
  
  const enabledCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 bg-secondary/50 border-border hover:bg-secondary",
            enabledCount > 0 && "border-primary/30"
          )}
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Colunas</span>
          {enabledCount > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
              {enabledCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-card border-border" align="end">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Colunas Visíveis</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        <div className="space-y-1">
          {(Object.keys(columnLabels) as (keyof VisibleColumns)[]).map((key) => (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors",
                visibleColumns[key]
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span>{columnLabels[key]}</span>
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  visibleColumns[key]
                    ? "bg-primary border-primary"
                    : "border-muted-foreground"
                )}
              >
                {visibleColumns[key] && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
