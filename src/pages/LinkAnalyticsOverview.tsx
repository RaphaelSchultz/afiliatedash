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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    MousePointerClick,
    Link as LinkIcon,
    Users,
    Activity,
    Smartphone,
    Monitor,
    Globe,
    Calendar as CalendarIcon,
    Filter,
    Zap,
    Timer,
    AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfMonth, startOfDay, endOfDay, parseISO } from 'date-fns';
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

// --- RPC Interfaces ---
type LinkOption = {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    original_url: string;
}

type DashboardAnalytics = {
    summary: {
        total_clicks: number;
        avg_latency: number;
    };
    evolution: {
        dia: string; // YYYY-MM-DD
        total_clicks: number;
    }[];
    devices: {
        key: string;
        count: number;
    }[];
    countries: {
        key: string;
        count: number;
    }[];
    referrers: {
        key: string;
        count: number;
    }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function LinkAnalyticsOverview() {
    const [dateRange, setDateRange] = useState(DATE_RANGES.LAST_7_DAYS);
    const [customDate, setCustomDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [selectedLink, setSelectedLink] = useState<string>('all');

    // Helper: Get Date Range ISO strings
    const getDateRangeISO = () => {
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
                end = today;
                break;
            case DATE_RANGES.LAST_30_DAYS:
                start = subDays(today, 29);
                end = today;
                break;
            case DATE_RANGES.THIS_MONTH:
                start = startOfMonth(today);
                end = today;
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

    const { start, end } = getDateRangeISO();

    // 1. Fetch Links Options (RPC)
    const { data: linksOptions = [] } = useQuery({
        queryKey: ['my-links-options'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_my_links_options');
            if (error) {
                console.error("Error fetching links options:", error);
                return [];
            }
            return data as LinkOption[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Fetch Dashboard Analytics (RPC)
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['clicks-analytics-dashboard', start, end, selectedLink],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_clicks_analytics_dashboard', {
                p_start_date: start,
                p_end_date: end,
                p_link_id: selectedLink === 'all' ? null : selectedLink
            });

            if (error) {
                console.error("Error fetching dashboard analytics:", error);
                throw error;
            }

            return data as DashboardAnalytics;
        }
    });

    // Helpers for UI
    const getLatencyStatus = (ms: number) => {
        if (!ms || ms === 0) return { color: 'text-muted-foreground', icon: Activity };
        if (ms < 200) return { color: 'text-emerald-500', icon: Zap };
        if (ms < 500) return { color: 'text-amber-500', icon: Zap };
        return { color: 'text-rose-500', icon: Timer };
    };

    const latencyStatus = getLatencyStatus(analytics?.summary.avg_latency || 0);

    const getDeviceIcon = (deviceKey: string) => {
        const d = deviceKey.toLowerCase();
        if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) return <Smartphone className="w-4 h-4" />;
        if (d.includes('desktop') || d.includes('windows') || d.includes('mac')) return <Monitor className="w-4 h-4" />;
        return <Globe className="w-4 h-4" />;
    };

    // Prepare Pie Chart Data (Devices)
    const deviceData = useMemo(() => {
        return analytics?.devices.map(d => ({ name: d.key, value: d.count })) || [];
    }, [analytics?.devices]);

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Header & Filters */}
                <div className="flex flex-col gap-4 animate-slide-up">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground">Análise de Cliques (RPC)</h1>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {/* Link Filter */}
                            <Select value={selectedLink} onValueChange={setSelectedLink}>
                                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Filtrar por Link" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Links</SelectItem>
                                    {linksOptions.map(link => (
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
                                                disabled={(date) => date > new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>

                    {/* Total Clicks */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-20" /> : (
                                <div className="text-2xl font-bold">{analytics?.summary.total_clicks || 0}</div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                No período selecionado
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Links (from Options, client-side count is fine for this small list) */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Links Ativos</CardTitle>
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{linksOptions.filter(l => l.active).length}</div>
                            <p className="text-xs text-muted-foreground">
                                Total de links cadastrados
                            </p>
                        </CardContent>
                    </Card>

                    {/* Average Latency */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
                            <latencyStatus.icon className={cn("h-4 w-4", latencyStatus.color)} />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-20" /> : (
                                <div className={cn("text-2xl font-bold", latencyStatus.color)}>
                                    {analytics?.summary.avg_latency || 0}ms
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Tempo de resposta médio
                            </p>
                        </CardContent>
                    </Card>

                </div>

                {/* Main Evolution Chart */}
                <Card className="shadow-sm border-border animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <CardHeader>
                        <CardTitle>Evolução de Cliques</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {isLoading ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.evolution || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis
                                            dataKey="dia"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => format(parseISO(val), 'dd/MM')}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '8px',
                                                color: 'hsl(var(--foreground))'
                                            }}
                                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                            labelFormatter={(val) => format(parseISO(val as string), 'dd/MM/yyyy')}
                                        />
                                        <Bar dataKey="total_clicks" name="Cliques" fill="hsl(var(--shopee-orange))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>

                    {/* Referrers (Origin) */}
                    <Card className="shadow-sm border-border">
                        <CardHeader>
                            <CardTitle>Origem de Tráfego</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {isLoading ? (
                                    <Skeleton className="h-full w-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={analytics?.referrers?.slice(0, 8) || []}
                                            layout="vertical"
                                            margin={{ left: 0, right: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="key"
                                                type="category"
                                                width={100}
                                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                            />
                                            <Bar dataKey="count" name="Cliques" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Devices (Pie Chart) */}
                    <Card className="shadow-sm border-border">
                        <CardHeader>
                            <CardTitle>Dispositivos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {isLoading ? (
                                    <Skeleton className="h-full w-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={deviceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {deviceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                <div className="flex flex-wrap justify-center gap-4 mt-2">
                                    {deviceData.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                {getDeviceIcon(entry.name)}
                                                {entry.name} ({entry.value})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Countries Table */}
                    <Card className="shadow-sm border-border">
                        <CardHeader>
                            <CardTitle>Top Países</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>País</TableHead>
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
                                    ) : (analytics?.countries || []).slice(0, 8).map((country) => (
                                        <TableRow key={country.key}>
                                            <TableCell className="font-medium text-sm">
                                                {country.key || 'Desconhecido'}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm">
                                                {country.count}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!analytics?.countries || analytics.countries.length === 0) && !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                                Sem dados de localização
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>

                {/* Removed Detailed Click History Table in favor of Performance/RPC */}
                <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">Nota sobre os dados</p>
                        <p className="text-sm text-muted-foreground">
                            Para garantir a melhor performance, os dados detalhados linha-a-linha não são mais exibidos nesta tela.
                            Utilize os gráficos agregados para entender o comportamento do seu público.
                            Os dados mostrados respeitam o período de retenção do seu plano atual.
                        </p>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
