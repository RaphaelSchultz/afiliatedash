import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Copy, 
  Check, 
  Pencil, 
  Trash2, 
  BarChart3,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { CreateLinkModal } from '@/components/links/CreateLinkModal';
import { EditLinkModal } from '@/components/links/EditLinkModal';
import { LinkAnalyticsModal } from '@/components/links/LinkAnalyticsModal';

interface Link {
  id: string;
  name: string;
  slug: string;
  original_url: string;
  clicks_count: number;
  pixel_id: string | null;
  active: boolean;
  created_at: string;
}

export default function Links() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ['links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Link[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast({
        title: 'Link excluído',
        description: 'O link foi removido com sucesso.',
      });
      setDeleteDialogOpen(false);
      setSelectedLink(null);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o link.',
        variant: 'destructive',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('links')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });

  const copyToClipboard = async (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleEdit = (link: Link) => {
    setSelectedLink(link);
    setEditModalOpen(true);
  };

  const handleAnalytics = (link: Link) => {
    setSelectedLink(link);
    setAnalyticsModalOpen(true);
  };

  const handleDeleteClick = (link: Link) => {
    setSelectedLink(link);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedLink) {
      deleteMutation.mutate(selectedLink.id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Meus Links
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus links de redirecionamento e acompanhe as métricas
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Link
          </Button>
        </div>

        {/* Links Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Links Criados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-center">Cliques</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{link.name}</span>
                            <a 
                              href={link.original_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate max-w-[200px]"
                            >
                              {link.original_url}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              /r/{link.slug}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(link.slug)}
                            >
                              {copiedSlug === link.slug ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{link.clicks_count}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={link.active ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => toggleActiveMutation.mutate({ 
                              id: link.id, 
                              active: !link.active 
                            })}
                          >
                            {link.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleAnalytics(link)}
                              title="Ver Relatório"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(link)}
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(link)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <LinkIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum link criado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro link de redirecionamento para começar a rastrear cliques.
                </p>
                <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateLinkModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {selectedLink && (
        <>
          <EditLinkModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            link={selectedLink}
          />
          <LinkAnalyticsModal
            open={analyticsModalOpen}
            onOpenChange={setAnalyticsModalOpen}
            link={selectedLink}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Link</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o link "{selectedLink?.name}"? 
              Esta ação não pode ser desfeita e todos os dados de analytics serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
