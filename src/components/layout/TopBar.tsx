import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, X, ChevronDown } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const statusOptions = [
  { value: 'Completed', label: 'Concluído', color: 'bg-success' },
  { value: 'Pending', label: 'Pendente', color: 'bg-warning' },
  { value: 'Cancelled', label: 'Cancelado', color: 'bg-destructive' },
];

const channelOptions = [
  { value: 'Social Media', label: 'Redes Sociais' },
  { value: 'Direct', label: 'Direto' },
  { value: 'Organic', label: 'Orgânico' },
  { value: 'Paid', label: 'Pago' },
];

type SubIdField = 'sub_id1' | 'sub_id2' | 'sub_id3' | 'sub_id4' | 'sub_id5';
type SubIdFilterKey = 'subId1' | 'subId2' | 'subId3' | 'subId4' | 'subId5';

interface SubIdOptions {
  subId1: string[];
  subId2: string[];
  subId3: string[];
  subId4: string[];
  subId5: string[];
}

export function TopBar() {
  const { user } = useAuth();
  const { filters, setFilters, clearFilters, parsedDates, activeFiltersCount } = useFilters();
  const [showFilters, setShowFilters] = useState(false);
  const [subIdOptions, setSubIdOptions] = useState<SubIdOptions>({
    subId1: [],
    subId2: [],
    subId3: [],
    subId4: [],
    subId5: [],
  });

  // Fetch available SubID options
  useEffect(() => {
    if (!user) return;

    const fetchSubIdOptions = async () => {
      const subIdFields: SubIdField[] = ['sub_id1', 'sub_id2', 'sub_id3', 'sub_id4', 'sub_id5'];
      const results: SubIdOptions = {
        subId1: [],
        subId2: [],
        subId3: [],
        subId4: [],
        subId5: [],
      };

      for (const field of subIdFields) {
        const { data } = await supabase
          .from('shopee_vendas')
          .select(field)
          .eq('user_id', user.id)
          .not(field, 'is', null)
          .limit(100);

        if (data) {
          const key = field.replace('_', '') as SubIdFilterKey;
          const uniqueValues = [...new Set(data.map((row: any) => row[field]).filter(Boolean))];
          results[key] = uniqueValues.sort();
        }
      }

      setSubIdOptions(results);
    };

    fetchSubIdOptions();
  }, [user]);

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    setFilters({ status: newStatus });
  };

  const toggleChannel = (channel: string) => {
    const newChannels = filters.channels.includes(channel)
      ? filters.channels.filter((c) => c !== channel)
      : [...filters.channels, channel];
    setFilters({ channels: newChannels });
  };

  const toggleSubId = (key: SubIdFilterKey, value: string) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setFilters({ [key]: newValues });
  };

  const renderSubIdDropdown = (key: SubIdFilterKey, label: string) => {
    const options = subIdOptions[key];
    const selectedCount = filters[key].length;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-between bg-secondary/50 border-border hover:bg-secondary min-w-[120px]",
              selectedCount > 0 && "border-primary/50 bg-primary/10"
            )}
          >
            <span className="truncate">
              {selectedCount > 0 ? `${label} (${selectedCount})` : label}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-56 max-h-[300px] overflow-y-auto bg-card border-border z-50"
          align="start"
        >
          <DropdownMenuLabel className="text-muted-foreground">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nenhum valor encontrado
            </div>
          ) : (
            options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={filters[key].includes(option)}
                onCheckedChange={() => toggleSubId(key, option)}
                className="cursor-pointer"
              >
                <span className="truncate">{option}</span>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Date Range Picker */}
        <div className="flex items-center gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[140px] justify-start text-left font-normal bg-secondary/50 border-border hover:bg-secondary"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {format(parsedDates.startDate, 'dd/MM/yy', { locale: ptBR })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
              <Calendar
                mode="single"
                selected={parsedDates.startDate}
                onSelect={(date) =>
                  date && setFilters({ startDate: format(date, 'yyyy-MM-dd') })
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[140px] justify-start text-left font-normal bg-secondary/50 border-border hover:bg-secondary"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {format(parsedDates.endDate, 'dd/MM/yy', { locale: ptBR })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
              <Calendar
                mode="single"
                selected={parsedDates.endDate}
                onSelect={(date) =>
                  date && setFilters({ endDate: format(date, 'yyyy-MM-dd') })
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'relative bg-secondary/50 border-border hover:bg-secondary',
              showFilters && 'bg-primary/10 border-primary/20 text-primary'
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Badge variant="secondary" className="bg-secondary/80">
            {format(parsedDates.startDate, "dd MMM", { locale: ptBR })} -{' '}
            {format(parsedDates.endDate, "dd MMM yyyy", { locale: ptBR })}
          </Badge>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Filters */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Status do Pedido
              </h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filters.status.includes(status.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel Filters */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Canal
              </h4>
              <div className="flex flex-wrap gap-2">
                {channelOptions.map((channel) => (
                  <button
                    key={channel.value}
                    onClick={() => toggleChannel(channel.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filters.channels.includes(channel.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SubID Filters */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Filtrar por Sub ID
              </h4>
              <div className="flex flex-wrap gap-2">
                {renderSubIdDropdown('subId1', 'Sub ID 1')}
                {renderSubIdDropdown('subId2', 'Sub ID 2')}
                {renderSubIdDropdown('subId3', 'Sub ID 3')}
                {renderSubIdDropdown('subId4', 'Sub ID 4')}
                {renderSubIdDropdown('subId5', 'Sub ID 5')}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}