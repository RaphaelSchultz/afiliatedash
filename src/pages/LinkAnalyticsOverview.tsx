import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import {
    MousePointerClick,
    Link as LinkIcon,
    Users,
    Activity,
    Smartphone,
    Monitor,
    Globe,
    Settings2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Calendar as CalendarIcon,
    Filter,
    Zap,
    Timer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfMonth, parseISO, getHours, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const DATE_RANGES = {
    TODAY: 'today',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    CUSTOM: 'custom',
};

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
};

export default function LinkAnalyticsOverview() {
    const [dateRange, setDateRange] = useState(DATE_RANGES.LAST_7_DAYS);
    const [customDate, setCustomDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [selectedLink, setSelectedLink] = useState<string>('all');

    // Helpers
    const getDateRange = () => {
        const today = new Date();
        let start = today;
        let end = today;

        switch (dateRange) {
            case DATE_RANGES.TODAY:
                start = today;
                end = today;
                break;
            case DATE_RANGES.LAST_7_DAYS:
                start = subDays(today, 6);
                break;
            case DATE_RANGES.LAST_30_DAYS:
                start = subDays(today, 29);
                break;
            case DATE_RANGES.THIS_MONTH:
                start = startOfMonth(today);
                break;
            case DATE_RANGES.CUSTOM:
                if (customDate?.from) start = customDate.from;
                if (customDate?.to) end = customDate.to;
                break;
        }

        return {
            start: startOfDay(start).toISOString(),
            end: endOfDay(end).toISOString()
        };
    };

    const { data: analyticsData, isLoading } = useQuery({
        queryKey: ['link-analytics-overview', dateRange, customDate, selectedLink], // Re-fetch on filter change
        queryFn: async () => {
            // 1. Fetch Links first (to populate filter if needed, and map names)
            const { data: links } = await supabase
                .from('links')
                .select('id, name, slug, active, original_url');

            const { start, end } = getDateRange();

            // 2. Build Query
            let query = (supabase
                .from('link_analytics') as any)
                .select('id, created_at, link_id, device, referrer, country, city, latency_ms')
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: false });

            // Apply Link Filter at DB Level
            if (selectedLink !== 'all') {
                query = query.eq('link_id', selectedLink);
            }

            const { data: clicks, error } = await query;

            if (error) throw error;

            return { clicks: clicks || [], links: links || [] };
        }
    });

    // KPI Calcs
    const totalClicks = analyticsData?.clicks.length || 0;
    // Active links in the current selection context
    const activeLinksCount = selectedLink === 'all'
        ? analyticsData?.links.filter(l => l.active).length || 0
        : (analyticsData?.links.find(l => l.id === selectedLink)?.active ? 1 : 0);

    // Daily Avg Calc
    const { start, end } = getDateRange();
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyAvg = Math.round(totalClicks / Math.max(1, daysDiff));
    const uniqueClicks = new Set(analyticsData?.clicks.map(c => c.referrer + c.device)).size || 0;

    // Latency Calc
    const validLatencies = analyticsData?.clicks
        .map(c => c.latency_ms)
        .filter((l): l is number => l !== null && l !== undefined && l > 0) || [];

    const avgLatency = validLatencies.length > 0
        ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
        : 0;

    const getLatencyStatus = (ms: number) => {
        if (ms === 0) return { color: 'text-muted-foreground', icon: Activity };
        if (ms < 200) return { color: 'text-emerald-500', icon: Zap };
        if (ms < 500) return { color: 'text-amber-500', icon: Zap };
        return { color: 'text-rose-500', icon: Timer };
    };

    const latencyStatus = getLatencyStatus(avgLatency);

    // Charts Data
    const chartData = useMemo(() => {
        if (!analyticsData?.clicks) return [];
        const groups: Record<string, number> = {};

        let current = startDate;
        while (current <= endDate) {
            const key = format(current, 'dd/MM');
            if (!groups[key]) groups[key] = 0;
            current = new Date(current.setDate(current.getDate() + 1));
        }
        // ensure last day is included
        groups[format(endDate, 'dd/MM')] = groups[format(endDate, 'dd/MM')] || 0;

        analyticsData.clicks.forEach(click => {
            const date = format(parseISO(click.created_at), 'dd/MM');
            if (groups[date] !== undefined) groups[date]++;
        });

        return Object.entries(groups).map(([date, clicks]) => ({ date, clicks }));
    }, [analyticsData?.clicks, start, end]);

    const originData = useMemo(() => {
        if (!analyticsData?.clicks) return [];
        const counts: Record<string, number> = {};
        analyticsData.clicks.forEach(c => {
            const ref = c.referrer ? new URL(c.referrer).hostname.replace('www.', '') : 'Direto';
            counts[ref] = (counts[ref] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [analyticsData?.clicks]);

    const timeData = useMemo(() => {
        if (!analyticsData?.clicks) return [];
        const counts = Array(24).fill(0);
        analyticsData.clicks.forEach(c => {
            const hour = getHours(parseISO(c.created_at));
            counts[hour]++;
        });
        return counts.map((count, hour) => ({
            hour: `${hour}h`,
            clicks: count
        }));
    }, [analyticsData?.clicks]);

    const topLinks = useMemo(() => {
        if (!analyticsData?.links || !analyticsData?.clicks) return [];

        // If sorting by specific link, Top Links table is less relevant but we show it anyway or just the selected one
        const linksToShow = selectedLink === 'all'
            ? analyticsData.links
            : analyticsData.links.filter(l => l.id === selectedLink);

        return linksToShow.map(link => {
            const count = analyticsData.clicks.filter(c => c.link_id === link.id).length;
            return { ...link, count };
        }).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [analyticsData, selectedLink]);


    // Table Logic
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Sort State
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState({
        link: true,
        device: true,
        origin: true,
        location: true,
        latency: true
    });

    // Prepare table data with display values for sorting
    const tableData = useMemo(() => {
        if (!analyticsData?.clicks) return [];
        const linkMap = new Map(analyticsData.links.map(l => [l.id, l]));

        const mappedData = analyticsData.clicks.map(click => ({
            ...click,
            linkName: linkMap.get(click.link_id)?.name || 'Link Removido',
            linkSlug: linkMap.get(click.link_id)?.slug || '-',
            originDisplay: click.referrer ? 'Referência' : 'Direto',
            locationDisplay: `${click.city || ''} ${click.country || ''}`.trim() || '-',
        }));

        // Sort data
        return mappedData.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof typeof a];
            const bValue = b[sortConfig.key as keyof typeof b];

            if (aValue === bValue) return 0;
            // Handle nulls
            if ((aValue === null || aValue === undefined) && (bValue === null || bValue === undefined)) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [analyticsData?.clicks, analyticsData?.links, sortConfig]);

    const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE);
    const paginatedData = tableData.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-4 w-4 text-primary" />
            : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
    };

    const getLatencyColor = (ms: number | null) => {
        if (ms === null) return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
        if (ms < 200) return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
        if (ms < 500) return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
        return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20';
    };

    const getDeviceIcon = (device: string | null) => {
        const d = device?.toLowerCase() || '';
        if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) return <Smartphone className="w-4 h-4" />;
        if (d.includes('desktop') || d.includes('windows') || d.includes('mac')) return <Monitor className="w-4 h-4" />;
        return <Globe className="w-4 h-4" />;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Header & Filters */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground">Resumo Geral</h1>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {/* Link Filter */}
                            <Select value={selectedLink} onValueChange={setSelectedLink}>
                                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Filtrar por Link" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Links</SelectItem>
                                    {analyticsData?.links.map(link => (
                                        <SelectItem key={link.id} value={link.id}>
                                            {link.name} (/{link.slug})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Date Filter */}
                            <div className="flex gap-2">
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger className="w-full sm:w-[180px] bg-background">
                                        <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Selecione o período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={DATE_RANGES.TODAY}>Hoje</SelectItem>
                                        <SelectItem value={DATE_RANGES.LAST_7_DAYS}>Últimos 7 dias</SelectItem>
                                        <SelectItem value={DATE_RANGES.LAST_30_DAYS}>Últimos 30 dias</SelectItem>
                                        <SelectItem value={DATE_RANGES.THIS_MONTH}>Mês atual</SelectItem>
                                        <SelectItem value={DATE_RANGES.CUSTOM}>Período Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>

                                {dateRange === DATE_RANGES.CUSTOM && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] justify-start text-left font-normal",
                                                    !customDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {customDate?.from ? (
                                                    customDate.to ? (
                                                        <>
                                                            {format(customDate.from, "dd/MM/y")} -{" "}
                                                            {format(customDate.to, "dd/MM/y")}
                                                        </>
                                                    ) : (
                                                        format(customDate.from, "dd/MM/y")
                                                    )
                                                ) : (
                                                    <span>Selecione a data</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={customDate?.from}
                                                selected={customDate}
                                                onSelect={setCustomDate}
                                                numberOfMonths={2}
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <KPICard title="Total de Cliques" value={totalClicks} icon={MousePointerClick} loading={isLoading} />
                    <KPICard title="Links Ativos" value={activeLinksCount} icon={LinkIcon} loading={isLoading} />
                    <KPICard title="Média Diária" value={dailyAvg} icon={Activity} loading={isLoading} />
                    <KPICard title="Cliques Únicos" value={uniqueClicks} icon={Users} loading={isLoading} />

                    {/* Latency KPI */}
                    <Card className="shadow-sm border-border">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Latência Média</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <h3 className={cn("text-2xl font-bold", latencyStatus.color)}>
                                            {avgLatency}ms
                                        </h3>
                                    </div>
                                )}
                            </div>
                            <div className={cn("p-3 rounded-xl bg-opacity-10", isLoading ? "bg-muted" : "bg-background border border-border")}>
                                {isLoading ? (
                                    <Skeleton className="w-5 h-5" />
                                ) : (
                                    <latencyStatus.icon className={cn("w-5 h-5", latencyStatus.color)} />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Chart */}
                <Card className="shadow-sm border-border">
                    <CardHeader>
                        <CardTitle>Desempenho dos Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {isLoading ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '8px',
                                                color: 'hsl(var(--foreground))'
                                            }}
                                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        />
                                        <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--shopee-orange))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Grid for Origin, Time, and Top Links */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Origin Chart */}
                    <Card className="shadow-sm border-border">
                        <CardHeader>
                            <CardTitle>Cliques por Origem</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {isLoading ? (
                                    <Skeleton className="h-full w-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={originData} layout="vertical" margin={{ left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                            />
                                            <Bar dataKey="value" name="Cliques" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Time Analysis Chart */}
                    <Card className="shadow-sm border-border">
                        <CardHeader>
                            <CardTitle>Análise de Horários</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {isLoading ? (
                                    <Skeleton className="h-full w-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={timeData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                            />
                                            <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--shopee-orange))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Links Table */}
                    <Card className="shadow-sm border-border lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Links Mais Acessados</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Link</TableHead>
                                        <TableHead className="text-right">Cliques</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : topLinks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                                Nenhum dado
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        topLinks.map(link => (
                                            <TableRow key={link.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium truncate max-w-[120px]" title={link.name}>{link.name}</span>
                                                        <span className="text-xs text-blue-500 truncate max-w-[120px]">/{link.slug}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {link.count}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>

                {/* Detailed Click History Table */}
                <Card className="shadow-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-xl">Histórico de Cliques</CardTitle>
                        <div className="flex items-center gap-2">
                            {/* Column Visibility Toggle */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="hidden h-8 lg:flex">
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        Colunas
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[150px]">
                                    <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.link}
                                        onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, link: val }))}
                                    >
                                        Link
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.device}
                                        onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, device: val }))}
                                    >
                                        Dispositivo
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.origin}
                                        onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, origin: val }))}
                                    >
                                        Origem
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.location}
                                        onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, location: val }))}
                                    >
                                        Local
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.latency}
                                        onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, latency: val }))}
                                    >
                                        Latência
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Pagination Controls */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground mx-2">
                                    Página {page + 1} de {totalPages || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1 || isLoading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center">
                                            Data/Hora
                                            {getSortIcon('created_at')}
                                        </div>
                                    </TableHead>
                                    {visibleColumns.link && (
                                        <TableHead
                                            className="cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('linkName')}
                                        >
                                            <div className="flex items-center">
                                                Link
                                                {getSortIcon('linkName')}
                                            </div>
                                        </TableHead>
                                    )}
                                    {visibleColumns.device && (
                                        <TableHead
                                            className="cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('device')}
                                        >
                                            <div className="flex items-center">
                                                Dispositivo
                                                {getSortIcon('device')}
                                            </div>
                                        </TableHead>
                                    )}
                                    {visibleColumns.origin && (
                                        <TableHead
                                            className="cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('originDisplay')}
                                        >
                                            <div className="flex items-center">
                                                Origem
                                                {getSortIcon('originDisplay')}
                                            </div>
                                        </TableHead>
                                    )}
                                    {visibleColumns.location && (
                                        <TableHead
                                            className="cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('locationDisplay')}
                                        >
                                            <div className="flex items-center">
                                                Local
                                                {getSortIcon('locationDisplay')}
                                            </div>
                                        </TableHead>
                                    )}
                                    {visibleColumns.latency && (
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('latency_ms')}
                                        >
                                            <div className="flex items-center justify-end">
                                                Latência
                                                {getSortIcon('latency_ms')}
                                            </div>
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            {visibleColumns.link && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                            {visibleColumns.device && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                            {visibleColumns.origin && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                            {visibleColumns.location && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                            {visibleColumns.latency && <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>}
                                        </TableRow>
                                    ))
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Nenhum clique registrado neste período.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-xs whitespace-nowrap">
                                                {format(parseISO(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </TableCell>
                                            {visibleColumns.link && (
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium truncate max-w-[150px]" title={item.linkName}>
                                                            {item.linkName}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                            /{item.linkSlug}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleColumns.device && (
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        {getDeviceIcon(item.device)}
                                                        <span className="truncate max-w-[100px]" title={item.device || 'Desconhecido'}>
                                                            {item.device || 'Desconhecido'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleColumns.origin && (
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {item.originDisplay}
                                                        </span>
                                                        {item.referrer && (
                                                            <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.referrer}>
                                                                {item.referrer}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleColumns.location && (
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.locationDisplay !== '-' ? item.locationDisplay : '-'}
                                                    </span>
                                                </TableCell>
                                            )}
                                            {visibleColumns.latency && (
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className={`${getLatencyColor(item.latency_ms)} border-0`}>
                                                        {item.latency_ms ? `${item.latency_ms}ms` : 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </DashboardLayout>
    );
}

// Sub-components

function KPICard({ title, value, icon: Icon, loading }: any) {
    return (
        <Card className="shadow-sm border-border">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    {loading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                        <h3 className="text-2xl font-bold mt-1">{value.toLocaleString('pt-BR')}</h3>
                    )}
                </div>
                <div className="bg-primary/10 p-3 rounded-xl">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
            </CardContent>
        </Card>
    )
}
