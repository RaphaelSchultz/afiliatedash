import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Eye, EyeOff, Key, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ShopeeCredential {
  id: number;
  account_name: string | null;
  app_id: string;
  app_secret: string;
  is_active: boolean | null;
  created_at: string | null;
  last_sync_at: string | null;
}

export function APIsTab() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ShopeeCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState({
    account_name: '',
    app_id: '',
    app_secret: '',
  });

  const fetchCredentials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopee_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar credenciais',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.app_id.trim() || !formData.app_secret.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'App ID e Secret são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('shopee_credentials')
        .insert({
          user_id: user.id,
          account_name: formData.account_name || null,
          app_id: formData.app_id,
          app_secret: formData.app_secret,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Credencial adicionada!',
        description: 'Sua chave API da Shopee foi salva com sucesso.',
      });

      setFormData({ account_name: '', app_id: '', app_secret: '' });
      setShowForm(false);
      fetchCredentials();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('shopee_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Credencial removida',
        description: 'A chave API foi removida com sucesso.',
      });

      fetchCredentials();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSecretVisibility = (id: number) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskSecret = (secret: string) => {
    if (secret.length <= 8) return '••••••••';
    return secret.slice(0, 4) + '••••••••' + secret.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">APIs da Shopee</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas credenciais de acesso à API da Shopee Affiliates
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="gradient-shopee text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar API
            </Button>
          )}
        </div>

        {/* Add new credential form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-secondary/30 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-foreground">Nova Credencial</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Nome da Conta (opcional)</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="Ex: Conta Principal"
                className="bg-secondary/50 border-border h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_id">
                App ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app_id"
                value={formData.app_id}
                onChange={(e) => setFormData(prev => ({ ...prev, app_id: e.target.value }))}
                placeholder="Seu App ID da Shopee"
                className="bg-secondary/50 border-border h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_secret">
                App Secret <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app_secret"
                type="password"
                value={formData.app_secret}
                onChange={(e) => setFormData(prev => ({ ...prev, app_secret: e.target.value }))}
                placeholder="Seu App Secret da Shopee"
                className="bg-secondary/50 border-border h-11"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ account_name: '', app_id: '', app_secret: '' });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 gradient-shopee text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Credencial'
                )}
              </Button>
            </div>
          </form>
        )}

        {/* List of credentials */}
        {credentials.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma credencial cadastrada
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Adicione suas credenciais da API da Shopee para sincronizar seus dados de vendas e cliques.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl gradient-shopee flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {cred.account_name || 'Conta Shopee'}
                      </span>
                      <Badge variant={cred.is_active ? 'default' : 'secondary'} className="text-xs">
                        {cred.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      <p>App ID: <span className="text-foreground font-mono">{cred.app_id}</span></p>
                      <p className="flex items-center gap-2">
                        Secret: 
                        <span className="text-foreground font-mono">
                          {showSecrets[cred.id] ? cred.app_secret : maskSecret(cred.app_secret)}
                        </span>
                        <button
                          onClick={() => toggleSecretVisibility(cred.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {showSecrets[cred.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Credencial</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover esta credencial? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(cred.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
