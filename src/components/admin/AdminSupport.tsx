import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, ExternalLink, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ticket {
    id: string;
    name: string;
    email: string;
    message: string;
    media_url: string | null;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
}

const statusMap = {
    open: { label: 'Aberto', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    in_progress: { label: 'Em Andamento', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    resolved: { label: 'Resolvido', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    closed: { label: 'Fechado', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

export function AdminSupport() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    async function fetchTickets() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data as Ticket[]);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Erro ao carregar tickets de suporte');
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(ticketId: string, newStatus: string) {
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: newStatus })
                .eq('id', ticketId);

            if (error) throw error;

            setTickets(prev =>
                prev.map(t => (t.id === ticketId ? { ...t, status: newStatus as any } : t))
            );

            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
            }

            toast.success('Status atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status');
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Central de Suporte</h2>
                    <p className="text-muted-foreground">
                        Gerencie os reports de bugs e solicitações de suporte.
                    </p>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Mensagem</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Nenhum ticket encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{ticket.name || 'Anônimo'}</span>
                                            <span className="text-xs text-muted-foreground">{ticket.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <p className="truncate text-sm text-muted-foreground">
                                            {ticket.message}
                                        </p>
                                        {ticket.media_url && (
                                            <div className="flex items-center gap-1 mt-1 text-xs text-blue-500">
                                                <Paperclip className="w-3 h-3" />
                                                Mídia anexada
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${statusMap[ticket.status].color} border`}>
                                            {statusMap[ticket.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Detalhes
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Ticket</DialogTitle>
                    </DialogHeader>

                    {selectedTicket && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block mb-1">Usuário</span>
                                    <span className="font-medium">{selectedTicket.name}</span>
                                    <span className="block text-xs text-muted-foreground">{selectedTicket.email}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">Data</span>
                                    <span className="font-medium">
                                        {format(new Date(selectedTicket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="text-muted-foreground block mb-2 text-sm">Mensagem</span>
                                <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                                    {selectedTicket.message}
                                </div>
                            </div>

                            {selectedTicket.media_url && (
                                <div>
                                    <span className="text-muted-foreground block mb-2 text-sm">Anexo</span>
                                    <div className="rounded-lg border border-border overflow-hidden bg-muted/50">
                                        {selectedTicket.media_url.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? (
                                            <video
                                                src={selectedTicket.media_url}
                                                controls
                                                className="w-full max-h-[400px] object-contain"
                                            />
                                        ) : (
                                            <img
                                                src={selectedTicket.media_url}
                                                alt="Anexo do report"
                                                className="w-full max-h-[400px] object-contain"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">Alterar Status</span>
                                    <Select
                                        defaultValue={selectedTicket.status}
                                        onValueChange={(val) => handleStatusChange(selectedTicket.id, val)}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Aberto</SelectItem>
                                            <SelectItem value="in_progress">Em Andamento</SelectItem>
                                            <SelectItem value="resolved">Resolvido</SelectItem>
                                            <SelectItem value="closed">Fechado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
