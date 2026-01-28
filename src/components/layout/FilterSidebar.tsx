import { Filter, X, ChevronDown, Check } from 'lucide-react';
import { useFilters, type FilterConfig, type Filters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { SEM_SUB_ID, type SubIdFilterKey } from '@/lib/subIdUtils';
import { useMemo, useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { useLocation } from 'react-router-dom';

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

interface FilterSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subIdOptions: { [key: string]: string[] } | Record<string, string[]>;
    filterConfig?: FilterConfig;
}

export function FilterSidebar({ open, onOpenChange, subIdOptions, filterConfig }: FilterSidebarProps) {
    const { filters, setFilters, clearFilters, parsedDates } = useFilters(filterConfig);
    const location = useLocation();

    // Local state for deferred filtering
    const [pendingFilters, setPendingFilters] = useState<Filters>(filters);

    // Sync local state when sidebar opens or global filters change (e.g. URL update)
    useEffect(() => {
        if (open) {
            setPendingFilters(filters);
        }
    }, [open, filters]);

    const toggleStatus = (status: string) => {
        const newStatus = pendingFilters.status.includes(status)
            ? pendingFilters.status.filter((s) => s !== status)
            : [...pendingFilters.status, status];
        setPendingFilters(prev => ({ ...prev, status: newStatus }));
    };

    const toggleChannel = (channel: string) => {
        const newChannels = pendingFilters.channels.includes(channel)
            ? pendingFilters.channels.filter((c) => c !== channel)
            : [...pendingFilters.channels, channel];
        setPendingFilters(prev => ({ ...prev, channels: newChannels }));
    };

    const toggleSubId = (key: SubIdFilterKey, value: string) => {
        const currentValues = pendingFilters[key];
        const newValues = currentValues.includes(value)
            ? currentValues.filter((v) => v !== value)
            : [...currentValues, value];
        setPendingFilters(prev => ({ ...prev, [key]: newValues }));
    };

    const renderSubIdDropdown = (key: SubIdFilterKey, label: string) => {
        const options = subIdOptions[key] || [];
        const selectedCount = pendingFilters[key].length;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-between bg-secondary/50 border-border hover:bg-secondary focus-visible:ring-0",
                            selectedCount > 0 && "bg-primary/10 text-primary"
                        )}
                    >
                        <span className="truncate">
                            {selectedCount > 0 ? `${label} (${selectedCount})` : label}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[280px] max-h-[300px] overflow-y-auto bg-card border-border z-[100]"
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
                                checked={pendingFilters[key].includes(option)}
                                onCheckedChange={() => toggleSubId(key, option)}
                                onSelect={(e) => e.preventDefault()} // Prevent dropdown from closing on item click
                                className="cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className={cn("truncate", option === SEM_SUB_ID && "italic text-muted-foreground")}>
                                        {option}
                                    </span>
                                </div>
                            </DropdownMenuCheckboxItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // Convert pending dates to DateRange for the picker
    const dateRange: DateRange = useMemo(() => {
        const from = pendingFilters.startDate ? parseISO(pendingFilters.startDate) : undefined;
        const to = pendingFilters.endDate ? parseISO(pendingFilters.endDate) : undefined;
        return { from, to };
    }, [pendingFilters.startDate, pendingFilters.endDate]);

    // Check if current page should use single day selection only
    const singleDayOnly = location.pathname === '/analytics/day';

    const handleDateRangeChange = (range: DateRange | undefined) => {
        if (range?.from) {
            setPendingFilters(prev => ({
                ...prev,
                startDate: format(range.from!, 'yyyy-MM-dd'),
                endDate: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from!, 'yyyy-MM-dd'),
            }));
        } else {
            // If range is undefined (e.g., cleared), clear dates in pendingFilters
            setPendingFilters(prev => ({
                ...prev,
                startDate: undefined,
                endDate: undefined,
            }));
        }
    };

    const handleApplyFilters = () => {
        setFilters(pendingFilters);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto w-full sm:w-[400px] border-l border-border bg-background/95 backdrop-blur-xl">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary" />
                        Filtros
                    </SheetTitle>
                    <SheetDescription>
                        Refine a visualização dos seus dados
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Mobile Date Range Picker */}
                    <div className="lg:hidden">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Período
                        </h4>
                        <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={handleDateRangeChange}
                            className="w-full"
                            singleDayOnly={singleDayOnly}
                        />
                    </div>

                    {/* Status Filters */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-between">
                            Status do Pedido
                            {pendingFilters.status.length > 0 && (
                                <span className="text-xs text-primary">{pendingFilters.status.length} selecionados</span>
                            )}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => toggleStatus(status.value)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-transparent',
                                        pendingFilters.status.includes(status.value)
                                            ? 'bg-primary/20 text-primary border-primary/50'
                                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border-border'
                                    )}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Channel Filters */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-between">
                            Canal
                            {pendingFilters.channels.length > 0 && (
                                <span className="text-xs text-primary">{pendingFilters.channels.length} selecionados</span>
                            )}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {channelOptions.map((channel) => (
                                <button
                                    key={channel.value}
                                    onClick={() => toggleChannel(channel.value)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-transparent',
                                        pendingFilters.channels.includes(channel.value)
                                            ? 'bg-primary/20 text-primary border-primary/50'
                                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border-border'
                                    )}
                                >
                                    {channel.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SubID Filters */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            Filtrar por Sub ID
                        </h4>
                        <div className="grid gap-3">
                            {renderSubIdDropdown('subId1', 'Sub ID 1')}
                            {renderSubIdDropdown('subId2', 'Sub ID 2')}
                            {renderSubIdDropdown('subId3', 'Sub ID 3')}
                            {renderSubIdDropdown('subId4', 'Sub ID 4')}
                            {renderSubIdDropdown('subId5', 'Sub ID 5')}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border space-y-3">
                    <Button
                        className="w-full"
                        onClick={handleApplyFilters}
                    >
                        Ver Resultados
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full border-dashed border-white/10 hover:bg-secondary hover:text-foreground hover:border-white/20"
                        onClick={clearFilters}
                    >
                        Limpar Filtros
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
