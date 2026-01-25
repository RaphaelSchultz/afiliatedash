import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Settings() {
  const { user, profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua conta e preferências.
          </p>
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Perfil
          </h2>

          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-shopee flex items-center justify-center text-white text-xl font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última sincronização</p>
                  <p className="text-foreground">
                    {profile?.last_sync_data
                      ? format(new Date(profile.last_sync_data), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
                      : 'Nunca'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Segurança
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Alterar senha</p>
                <p className="text-sm text-muted-foreground">
                  Atualize sua senha de acesso
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                Alterar
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-foreground">Autenticação em dois fatores</p>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                Em breve
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
