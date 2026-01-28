import { useState } from 'react';
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
import { Shuffle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CreateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateRandomSlug(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function CreateLinkModal({ open, onOpenChange }: CreateLinkModalProps) {
  const [name, setName] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [pixelId, setPixelId] = useState('');
  const [slugError, setSlugError] = useState('');
  const [urlError, setUrlError] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if slug already exists
      const { data: existingLink } = await supabase
        .from('links')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingLink) {
        throw new Error('Esta slug já está em uso');
      }

      // Create link
      const { error } = await supabase
        .from('links')
        .insert({
          user_id: user.id,
          name,
          slug,
          original_url: originalUrl,
          pixel_id: pixelId || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast({
        title: 'Link criado!',
        description: 'Seu novo link de redirecionamento está pronto.',
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error.message === 'Esta slug já está em uso') {
        setSlugError(error.message);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o link. Tente novamente.',
          variant: 'destructive',
        });
      }
    },
  });

  const resetForm = () => {
    setName('');
    setOriginalUrl('');
    setSlug('');
    setPixelId('');
    setSlugError('');
    setUrlError('');
  };

  const handleGenerateSlug = () => {
    setSlug(generateRandomSlug());
    setSlugError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL
    if (!isValidUrl(originalUrl)) {
      setUrlError('URL inválida. Inclua o protocolo (https://)');
      return;
    }
    setUrlError('');

    // Validate slug
    if (!slug.match(/^[a-z0-9-]+$/)) {
      setSlugError('A slug deve conter apenas letras minúsculas, números e hífens');
      return;
    }
    setSlugError('');

    createMutation.mutate();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Link</DialogTitle>
          <DialogDescription>
            Crie um link curto para rastrear cliques e conversões.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Link</Label>
            <Input
              id="name"
              placeholder="Ex: Promoção Natal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="originalUrl">URL de Destino</Label>
            <Input
              id="originalUrl"
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
            <Label htmlFor="slug">Slug (identificador curto)</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  /r/
                </span>
                <Input
                  id="slug"
                  placeholder="promo-natal"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setSlugError('');
                  }}
                  className={`pl-9 ${slugError ? 'border-destructive' : ''}`}
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateSlug}
                title="Gerar slug aleatória"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixelId">Facebook Pixel ID (opcional)</Label>
            <Input
              id="pixelId"
              placeholder="Ex: 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, o pixel será disparado antes do redirecionamento.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Criar Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
