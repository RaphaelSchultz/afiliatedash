import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Link {
  id: string;
  name: string;
  slug: string;
  original_url: string;
  clicks_count: number;
  pixel_id: string | null;
  active: boolean;
}

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: Link;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function EditLinkModal({ open, onOpenChange, link }: EditLinkModalProps) {
  const [name, setName] = useState(link.name);
  const [originalUrl, setOriginalUrl] = useState(link.original_url);
  const [pixelId, setPixelId] = useState(link.pixel_id || '');
  const [active, setActive] = useState(link.active);
  const [urlError, setUrlError] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form when link changes
  useEffect(() => {
    setName(link.name);
    setOriginalUrl(link.original_url);
    setPixelId(link.pixel_id || '');
    setActive(link.active);
    setUrlError('');
  }, [link]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('links')
        .update({
          name,
          original_url: originalUrl,
          pixel_id: pixelId || null,
          active,
        })
        .eq('id', link.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast({
        title: 'Link atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o link. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL
    if (!isValidUrl(originalUrl)) {
      setUrlError('URL inválida. Inclua o protocolo (https://)');
      return;
    }
    setUrlError('');

    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Link</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu link de redirecionamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Link</Label>
            <Input
              id="edit-name"
              placeholder="Ex: Promoção Natal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <code className="text-sm">/r/{link.slug}</code>
            </div>
            <p className="text-xs text-muted-foreground">
              A slug não pode ser alterada após a criação.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-originalUrl">URL de Destino</Label>
            <Input
              id="edit-originalUrl"
              type="url"
              placeholder="https://shopee.com.br/produto..."
              value={originalUrl}
              onChange={(e) => {
                setOriginalUrl(e.target.value);
                setUrlError('');
              }}
              required
              className={urlError ? 'border-destructive' : ''}
            />
            {urlError && (
              <p className="text-sm text-destructive">{urlError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-pixelId">Facebook Pixel ID (opcional)</Label>
            <Input
              id="edit-pixelId"
              placeholder="Ex: 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edit-active">Link Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Links inativos não redirecionam visitantes
              </p>
            </div>
            <Switch
              id="edit-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
