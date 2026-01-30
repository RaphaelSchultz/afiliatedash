import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Smartphone, Monitor, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClickHistoryItem {
    id: string; // or number based on your DB, assuming string/uuid or number
    created_at: string;
    device: string | null;
    referrer: string | null;
    channel: string | null;
    latency_ms: number | null;
    country: string | null;
    city: string | null;
}

interface LinkClickHistoryTableProps {
    linkId: string;
}

const ITEMS_PER_PAGE = 20;

export function LinkClickHistoryTable({ linkId }: LinkClickHistoryTableProps) {
    const [history, setHistory] = useState<ClickHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [linkId, page]);

    const fetchHistory = async () => {
        setIsLoading(true);
        const from = page * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        // We manually cast the select result because latency_ms might not be in the auto-generated types yet
        const { data, error } = await supabase
            .from('link_analytics')
            .select('id, created_at, device, referrer, channel, country, city, latency_ms') // Request specific columns including latency_ms
            .eq('link_id', linkId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching click history:', error);
        } else {
            if (data) {
                setHistory(data as unknown as ClickHistoryItem[]);
                if (data.length < ITEMS_PER_PAGE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }
        }
        setIsLoading(false);
    };

    const getLatencyColor = (ms: number | null) => {
        if (ms === null) return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
        if (ms < 200) return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
        if (ms < 500) return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
    };

    const getDeviceIcon = (device: string | null) => {
        const d = device?.toLowerCase() || '';
        if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) return <Smartphone className="w-4 h-4" />;
        if (d.includes('desktop') || d.includes('windows') || d.includes('mac')) return <Monitor className="w-4 h-4" />;
        return <Globe className="w-4 h-4" />;
    };

    const nextPage = () => setPage(p => p + 1);
    const prevPage = () => setPage(p => Math.max(0, p - 1));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Histórico de Cliques</h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={prevPage}
                        disabled={page === 0 || isLoading}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Página {page + 1}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={nextPage}
                        disabled={!hasMore || isLoading}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Dispositivo</TableHead>
                            <TableHead>Origem</TableHead>
                            <TableHead>Local</TableHead>
                            <TableHead className="text-right">Latência</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhum clique registrado neste período.
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell className="font-medium text-xs whitespace-nowrap">
                                        {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            {getDeviceIcon(item.device)}
                                            <span className="truncate max-w-[100px]" title={item.device || 'Desconhecido'}>
                                                {item.device || 'Desconhecido'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {item.channel || (item.referrer ? 'Referência' : 'Direto')}
                                            </span>
                                            {item.referrer && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.referrer}>
                                                    {item.referrer}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {item.city ? `${item.city}, ` : ''}{item.country || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={`${getLatencyColor(item.latency_ms)} border-0`}>
                                            {item.latency_ms ? `${item.latency_ms}ms` : 'N/A'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
