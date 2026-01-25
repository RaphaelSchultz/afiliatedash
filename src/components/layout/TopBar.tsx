import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

export function TopBar() {
  const { filters, setFilters, clearFilters, parsedDates } = useFilters();
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount =
    filters.status.length + filters.channels.length;

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

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Date Range Picker */}
        <div className="flex items-center gap-3">
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
            <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
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
            <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>
      )}
    </header>
  );
}
