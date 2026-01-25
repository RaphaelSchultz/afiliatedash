import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';

export function PersonalDataTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp: '',
    instagram: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        whatsapp: (profile as any).whatsapp || '',
        instagram: (profile as any).instagram || '',
      });
      setAvatarUrl((profile as any).avatar_url || null);
    }
  }, [profile]);

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    if (refreshProfile) {
      refreshProfile();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          whatsapp: formData.whatsapp,
          instagram: formData.instagram,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Dados salvos!',
        description: 'Suas informações foram atualizadas com sucesso.',
      });

      if (refreshProfile) {
        refreshProfile();
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-foreground mb-6">Dados Pessoais</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar + Name/Email Section */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar Upload - Left side */}
          <div className="flex-shrink-0">
            <AvatarUpload 
              avatarUrl={avatarUrl} 
              onAvatarChange={handleAvatarChange}
              instagramUsername={formData.instagram}
            />
          </div>
          
          {/* Name and Email - Right side */}
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Seu nome completo"
                className="bg-secondary/50 border-border h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-secondary/30 border-border h-12 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Este é o e-mail da sua conta e não pode ser alterado aqui.
              </p>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/10" />

        {/* Other fields below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label htmlFor="whatsapp">
              WhatsApp <span className="text-destructive">*</span>
            </Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
              placeholder="(00) 00000-0000"
              className="bg-secondary/50 border-border h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Pessoal</Label>
            <Input
              id="instagram"
              value={formData.instagram}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
              placeholder="@seuusuario"
              className="bg-secondary/50 border-border h-12"
            />
            <p className="text-xs text-muted-foreground">
              Opcional - Usado para importar sua foto de perfil
            </p>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full gradient-shopee text-white h-12 text-base font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Dados Pessoais'
          )}
        </Button>
      </form>
    </div>
  );
}
