import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type InvestmentMode = 'none' | 'total' | 'perSubId';

export interface InvestmentData {
  mode: InvestmentMode;
  total?: number;
  perSubId?: Record<string, number>;
}

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InvestmentData) => void;
  initialData?: InvestmentData;
}

interface SubIdEntry {
  id: string;
  key: string;
  value: string;
}

export function InvestmentModal({ isOpen, onClose, onSave, initialData }: InvestmentModalProps) {
  const [mode, setMode] = useState<InvestmentMode>('none');
  const [totalValue, setTotalValue] = useState('');
  const [subIdEntries, setSubIdEntries] = useState<SubIdEntry[]>([
    { id: '1', key: '', value: '' }
  ]);

  // Initialize from existing data
  useEffect(() => {
    if (initialData) {
      setMode(initialData.mode);
      if (initialData.mode === 'total' && initialData.total) {
        setTotalValue(initialData.total.toFixed(2).replace('.', ','));
      }
      if (initialData.mode === 'perSubId' && initialData.perSubId) {
        const entries = Object.entries(initialData.perSubId).map(([key, value], index) => ({
          id: String(index + 1),
          key,
          value: value.toFixed(2).replace('.', ',')
        }));
        if (entries.length > 0) {
          setSubIdEntries(entries);
        }
      }
    }
  }, [initialData, isOpen]);

  const handleModeChange = (newMode: InvestmentMode) => {
    setMode(newMode);
  };

  const formatCurrencyInput = (value: string): string => {
    let cleaned = value.replace(/[^\d,]/g, '');
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + ',' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  const parseCurrencyValue = (value: string): number => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleAddEntry = () => {
    setSubIdEntries(prev => [
      ...prev,
      { id: String(Date.now()), key: '', value: '' }
    ]);
  };

  const handleRemoveEntry = (id: string) => {
    setSubIdEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleEntryChange = (id: string, field: 'key' | 'value', value: string) => {
    setSubIdEntries(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, [field]: field === 'value' ? formatCurrencyInput(value) : value };
      }
      return e;
    }));
  };

  const handleSave = () => {
    const data: InvestmentData = { mode };

    if (mode === 'total') {
      data.total = parseCurrencyValue(totalValue);
    } else if (mode === 'perSubId') {
      const perSubId: Record<string, number> = {};
      subIdEntries.forEach(entry => {
        if (entry.key.trim()) {
          perSubId[entry.key.trim()] = parseCurrencyValue(entry.value);
        }
      });
      data.perSubId = perSubId;
    }

    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Configurar Investimentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">Como deseja informar os investimentos?</Label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleModeChange('none')}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  mode === 'none'
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  mode === 'none' ? "border-primary" : "border-muted-foreground"
                )}>
                  {mode === 'none' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-medium">Não informar</p>
                  <p className="text-xs text-muted-foreground">Não considerar investimentos no cálculo</p>
                </div>
              </button>

              <button
                onClick={() => handleModeChange('total')}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  mode === 'total'
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  mode === 'total' ? "border-primary" : "border-muted-foreground"
                )}>
                  {mode === 'total' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-medium">Investimento Total</p>
                  <p className="text-xs text-muted-foreground">Valor único para o período inteiro</p>
                </div>
              </button>

              <button
                onClick={() => handleModeChange('perSubId')}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  mode === 'perSubId'
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  mode === 'perSubId' ? "border-primary" : "border-muted-foreground"
                )}>
                  {mode === 'perSubId' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-medium">Por Sub ID</p>
                  <p className="text-xs text-muted-foreground">Valores específicos por tag/campanha</p>
                </div>
              </button>
            </div>
          </div>

          {/* Total Investment Input */}
          {mode === 'total' && (
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="total-investment" className="text-muted-foreground">
                Valor Total Investido
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="total-investment"
                  value={totalValue}
                  onChange={(e) => setTotalValue(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="pl-10 bg-secondary/30 border-border"
                />
              </div>
            </div>
          )}

          {/* Per SubID Inputs */}
          {mode === 'perSubId' && (
            <div className="space-y-3 animate-slide-up">
              <Label className="text-muted-foreground">Investimentos por Sub ID</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {subIdEntries.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <Input
                      value={entry.key}
                      onChange={(e) => handleEntryChange(entry.id, 'key', e.target.value)}
                      placeholder="Nome do Sub ID"
                      className="flex-1 bg-secondary/30 border-border"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        value={entry.value}
                        onChange={(e) => handleEntryChange(entry.id, 'value', e.target.value)}
                        placeholder="0,00"
                        className="pl-10 bg-secondary/30 border-border"
                      />
                    </div>
                    {subIdEntries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="text-muted-foreground hover:text-destructive h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddEntry}
                className="w-full border-dashed border-border text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Sub ID
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
