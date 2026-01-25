import { useEffect, useState } from 'react';
import { Check, Crown, Sparkles, X, FileSpreadsheet, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Plan {
  id: 'basic' | 'intermediate' | 'pro';
  name: string;
  price: string;
  description: string;
  features: { text: string; included: boolean }[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$47',
    description: 'Para quem está começando',
    features: [
      { text: 'Dashboard Completo', included: true },
      { text: 'Guarda planilhas (7 dias)', included: false },
      { text: 'Investimentos detalhados', included: false },
      { text: 'Integração API Shopee', included: false },
      { text: 'Análise Mensal', included: false },
      { text: 'Comissões a Validar', included: false },
    ],
  },
  {
    id: 'intermediate',
    name: 'Intermediário',
    price: 'R$67',
    description: 'Para afiliados em crescimento',
    features: [
      { text: 'Dashboard Completo', included: true },
      { text: 'Guarda planilhas (30 dias)', included: true },
      { text: 'Investimentos Ilimitado', included: true },
      { text: 'Integração API Shopee', included: false },
      { text: 'Análise Mensal', included: false },
      { text: 'Comissões a Validar', included: false },
    ],
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Afiliado PRO',
    price: 'R$97',
    description: 'Para escalar resultados',
    features: [
      { text: 'Dashboard Completo', included: true },
      { text: 'Guarda planilhas (Ilimitado)', included: true },
      { text: 'Investimentos Ilimitado', included: true },
      { text: 'Integração API Shopee', included: true },
      { text: 'Análise Mensal', included: true },
      { text: 'Comissões a Validar', included: true },
    ],
  },
];

interface UploadStats {
  total: number;
  thisMonth: number;
  lastUpload: string | null;
}

export function MyPlanTab() {
  const { user } = useAuth();
  const [currentPlanId, setCurrentPlanId] = useState<'basic' | 'intermediate' | 'pro'>('basic');
  const [uploadStats, setUploadStats] = useState<UploadStats>({ total: 0, thisMonth: 0, lastUpload: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Buscar assinatura do usuário
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscription) {
        setCurrentPlanId(subscription.plan_type as 'basic' | 'intermediate' | 'pro');
      }

      // Buscar estatísticas de uploads
      const { data: uploads } = await supabase
        .from('upload_history')
        .select('id, uploaded_at')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (uploads) {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const thisMonthCount = uploads.filter(u => 
          new Date(u.uploaded_at) >= thisMonthStart
        ).length;

        setUploadStats({
          total: uploads.length,
          thisMonth: thisMonthCount,
          lastUpload: uploads[0]?.uploaded_at || null,
        });
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="glass-card rounded-2xl p-6 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Seu Plano Atual
            </p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-foreground">{currentPlan.name}</h2>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </div>
          <Crown className="w-8 h-8 text-yellow-500" />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Recursos incluídos no seu plano:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {currentPlan.features.filter(f => f.included).map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-foreground">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Stats */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Histórico de Uploads
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-secondary/50">
            <p className="text-3xl font-bold text-foreground">{loading ? '...' : uploadStats.total}</p>
            <p className="text-sm text-muted-foreground">Total de uploads</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-secondary/50">
            <p className="text-3xl font-bold text-primary">{loading ? '...' : uploadStats.thisMonth}</p>
            <p className="text-sm text-muted-foreground">Este mês</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {loading ? '...' : uploadStats.lastUpload 
                ? format(new Date(uploadStats.lastUpload), "dd/MM/yyyy", { locale: ptBR })
                : 'Nenhum'
              }
            </p>
            <p className="text-sm text-muted-foreground">Último upload</p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isUpgrade = plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === currentPlanId);
          
          return (
            <div
              key={plan.id}
              className={cn(
                'glass-card rounded-2xl p-5 border transition-all relative',
                isCurrent 
                  ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-transparent' 
                  : 'border-white/10 hover:border-white/20',
                plan.highlighted && !isCurrent && 'border-blue-500/30'
              )}
            >
              {isCurrent && (
                <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                  Atual
                </Badge>
              )}

              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {plan.description}
              </p>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className={cn(
                        "w-4 h-4 flex-shrink-0 mt-0.5",
                        isCurrent ? "text-green-400" : "text-muted-foreground"
                      )} />
                    ) : (
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground/50" />
                    )}
                    <span className={cn(
                      feature.included 
                        ? (isCurrent ? "text-foreground" : "text-muted-foreground")
                        : "text-muted-foreground/50 line-through"
                    )}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? 'outline' : 'default'}
                className={cn(
                  'w-full',
                  isCurrent && 'border-primary/50 text-muted-foreground cursor-default',
                  !isCurrent && isUpgrade && 'gradient-shopee text-white',
                  !isCurrent && !isUpgrade && 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
                disabled={isCurrent}
              >
                {isCurrent ? 'Seu Plano Atual' : isUpgrade ? 'Fazer Upgrade' : 'Plano Inferior'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Aceitamos Pix, cartão e boleto
        </p>
        <p className="text-xs text-muted-foreground">
          🔒 Até 3 dispositivos por conta • Cancele quando quiser
        </p>
      </div>
    </div>
  );
}
