import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Instagram, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AvatarUploadProps {
  avatarUrl: string | null;
  onAvatarChange: (url: string) => void;
  instagramUsername?: string;
}

export function AvatarUpload({ avatarUrl, onAvatarChange, instagramUsername }: AvatarUploadProps) {
  const { user, profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onAvatarChange(urlWithCacheBust);

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar foto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportFromInstagram = async () => {
    const username = instagramUsername?.replace('@', '') || (profile as any)?.instagram?.replace('@', '');
    
    if (!username) {
      toast({
        title: 'Instagram não configurado',
        description: 'Primeiro adicione seu usuário do Instagram no campo abaixo.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsImporting(true);

    try {
      // Try multiple avatar proxy services as fallbacks
      const avatarServices = [
        `https://unavatar.io/instagram/${username}?fallback=false`,
        `https://images.weserv.nl/?url=instagram.com/${username}/&w=200&h=200&fit=cover&a=attention`,
      ];

      let successUrl: string | null = null;
      let lastError: Error | null = null;

      for (const serviceUrl of avatarServices) {
        try {
          // Test if the image loads by creating an Image object
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              // Check if it's a valid image (not a fallback/error image)
              if (img.width > 1 && img.height > 1) {
                resolve();
              } else {
                reject(new Error('Imagem inválida'));
              }
            };
            img.onerror = () => reject(new Error('Falha ao carregar imagem'));
            img.src = serviceUrl;
            
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Timeout')), 10000);
          });
          
          successUrl = serviceUrl;
          break;
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }

      if (!successUrl) {
        throw new Error('Perfis privados do Instagram não permitem importação automática. Use a opção "Fazer upload" com uma foto salva do seu perfil.');
      }

      // Use the proxy URL directly with cache busting
      const finalUrl = `${successUrl}&t=${Date.now()}`;

      // Update profile with the proxy URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onAvatarChange(finalUrl);

      toast({
        title: 'Foto importada!',
        description: 'Sua foto do Instagram foi importada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao importar',
        description: error.message || 'Não foi possível importar a foto do Instagram.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const isLoading = isUploading || isImporting;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="w-24 h-24 border-4 border-border">
          <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
          <AvatarFallback className="bg-secondary text-2xl font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2"
          >
            <Camera className="w-4 h-4" />
            Alterar Foto
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="bg-card border-border">
          <DropdownMenuItem 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            <User className="w-4 h-4 mr-2" />
            Fazer upload
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleImportFromInstagram}
            className="cursor-pointer"
          >
            <Instagram className="w-4 h-4 mr-2" />
            Importar do Instagram
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        JPG, PNG ou WEBP. Máximo 5MB.
      </p>
    </div>
  );
}
