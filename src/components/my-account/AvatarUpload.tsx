import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Instagram, User, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageCropper } from './ImageCropper';

interface AvatarUploadProps {
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
  instagramUsername?: string;
}

export function AvatarUpload({ avatarUrl, onAvatarChange, instagramUsername }: AvatarUploadProps) {
  const { user, profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Create object URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropperOpen(true);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setIsUploading(true);

    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Delete old avatars
      await supabase.storage.from('avatars').remove([
        `${user.id}/avatar.png`,
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
        `${user.id}/avatar.webp`,
      ]);

      // Upload cropped image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

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
      setSelectedImage(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setIsRemoving(true);

    try {
      // Delete all possible avatar files
      await supabase.storage.from('avatars').remove([
        `${user.id}/avatar.png`,
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
        `${user.id}/avatar.webp`,
      ]);

      // Update profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onAvatarChange(null);

      toast({
        title: 'Foto removida!',
        description: 'Sua foto de perfil foi removida com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover foto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
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
      const avatarServices = [
        `https://unavatar.io/instagram/${username}?fallback=false`,
        `https://images.weserv.nl/?url=instagram.com/${username}/&w=200&h=200&fit=cover&a=attention`,
      ];

      let successUrl: string | null = null;

      for (const serviceUrl of avatarServices) {
        try {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              if (img.width > 1 && img.height > 1) {
                resolve();
              } else {
                reject(new Error('Imagem inválida'));
              }
            };
            img.onerror = () => reject(new Error('Falha ao carregar imagem'));
            img.src = serviceUrl;
            setTimeout(() => reject(new Error('Timeout')), 10000);
          });
          
          successUrl = serviceUrl;
          break;
        } catch {
          continue;
        }
      }

      if (!successUrl) {
        throw new Error('Perfis privados do Instagram não permitem importação automática. Use a opção "Fazer upload" com uma foto salva do seu perfil.');
      }

      const finalUrl = `${successUrl}&t=${Date.now()}`;

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

  const isLoading = isUploading || isImporting || isRemoving;

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
          {avatarUrl && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleRemoveAvatar}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover foto
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        JPG, PNG ou WEBP. Máximo 5MB.
      </p>

      {/* Image Cropper Dialog */}
      {selectedImage && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
