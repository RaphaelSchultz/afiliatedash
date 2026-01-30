import { useEffect, useState } from 'react';
import { Check, Crown, Sparkles, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanFeature {
  id: string;
  label: string;
  is_included: boolean;
  order_index: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  subtitle: string | null;
  is_highlighted: boolean;
  button_text: string;
  button_link: string | null;
  button_link: string | null;
  slug: string;
  order_index: number;
  // is_highlighted already defined above
  highlight_text: string | null;
  highlight_text_color: string | null;
  highlight_bg_color: string | null;
  highlight_border_color: string | null;
  plan_features: PlanFeature[];
}

interface UploadStats {
  total: number;
  thisMonth: number;
  lastUpload: string | null;
}

export function MyPlanTab() {
  const { user } = useAuth();
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [uploadStats, setUploadStats] = useState<UploadStats>({ total: 0, thisMonth: 0, lastUpload: null });
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);

  // Fetch plans from database
  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from('plans')
        .select('*, plan_features(*)')
        .order('order_index');

      if (error) {
        console.error('Error fetching plans:', error);
        setPlansLoading(false);
        return;
      }

      // Sort features by order_index
      const sortedPlans = (data || []).map(plan => ({
        ...plan,
        plan_features: (plan.plan_features || []).sort((a: PlanFeature, b: PlanFeature) => a.order_index - b.order_index)
      }));

      setPlans(sortedPlans as unknown as Plan[]);
      setPlansLoading(false);
    }

    fetchPlans();
  }, []);

  // Fetch user subscription and upload stats
  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      // Buscar assinatura do usuário
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscription) {
        // Find plan by slug mapping
        const matchedPlan = plans.find(p => p.slug === subscription.plan_type);
        if (matchedPlan) {
          setCurrentPlanId(matchedPlan.id);
        } else {
          // Fallback if mismatched
          setCurrentPlanId(plans[0]?.id || null);
        }
      } else {
        // Default to first plan (usually Basic) if no subscription
        const basicPlan = plans.find(p => p.slug === 'basic') || plans[0];
        setCurrentPlanId(basicPlan?.id || null);
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

    fetchUserData();
  }, [user, plans]);

  const currentPlan = plans.find(p => p.id === currentPlanId) || plans.find(p => p.slug === 'basic') || plans[0];
  const currentPlanIndex = plans.findIndex(p => p.id === currentPlanId);

  return (
    <div className="space-y-6">
      {/* Current Plan Card - Only show if user has a plan */}
      {currentPlan && (
        <div className="glass-card rounded-2xl p-6 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Seu Plano Atual
              </p>
              <div className="flex items-center gap-2">
                {plansLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <h2 className="text-2xl font-bold text-foreground">{currentPlan?.name || 'Básico'}</h2>
                )}
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
            {plansLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-40" />
              ))
            ) : (
              currentPlan?.plan_features.filter(f => f.is_included).map((feature) => (
                <div key={feature.id} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-foreground">{feature.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plansLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-border">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-24 mb-1" />
              <Skeleton className="h-3 w-12 mb-4" />
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-2 mb-6">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : (
          plans.map((plan, index) => {
            const isCurrent = plan.id === currentPlanId;
            const isUpgrade = index > currentPlanIndex;

            return (
              <div
                key={plan.id}
                className={cn(
                  'glass-card rounded-2xl p-5 border transition-all relative flex flex-col h-full',
                  isCurrent
                    ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-transparent'
                    : 'border-border hover:border-muted-foreground/30',
                  plan.is_highlighted && !isCurrent && isUpgrade && 'shadow-lg'
                )}
                style={{
                  borderColor: (plan.is_highlighted && !isCurrent && isUpgrade && plan.highlight_border_color) ? plan.highlight_border_color : undefined,
                  boxShadow: (plan.is_highlighted && !isCurrent && isUpgrade && plan.highlight_border_color) ? `0 0 0 1px ${plan.highlight_border_color}80, 0 10px 15px -3px ${plan.highlight_border_color}10` : undefined
                }}
              >
                {plan.is_highlighted && !isCurrent && isUpgrade && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 shadow-md whitespace-nowrap"
                    style={{
                      backgroundColor: plan.highlight_bg_color || '#f97316',
                      color: plan.highlight_text_color || '#ffffff',
                    }}
                  >
                    {plan.highlight_text || 'Mais Popular'}
                  </Badge>
                )}
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
                    <span className="text-3xl font-bold text-foreground">R${plan.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {plan.subtitle}
                </p>

                <ul className="space-y-2 mb-6">
                  {plan.plan_features.map((feature) => (
                    <li key={feature.id} className="flex items-start gap-2 text-sm">
                      {feature.is_included ? (
                        <Check className={cn(
                          "w-4 h-4 flex-shrink-0 mt-0.5",
                          isCurrent ? "text-green-400" : "text-muted-foreground"
                        )} />
                      ) : (
                        <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground/50" />
                      )}
                      <span className={cn(
                        feature.is_included
                          ? cn(
                            isCurrent ? "text-foreground" : "text-muted-foreground",
                            "font-bold",
                            plan.is_highlighted && !isCurrent && isUpgrade && "text-white"
                          )
                          : "text-muted-foreground/50 line-through"
                      )}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrent ? 'outline' : 'default'}
                  className={cn(
                    'w-full mt-auto',
                    isCurrent && 'border-primary/50 text-muted-foreground cursor-default',
                    !isCurrent && isUpgrade && 'gradient-shopee text-white',
                    !isCurrent && !isUpgrade && 'bg-secondary text-foreground hover:bg-secondary/80'
                  )}
                  disabled={isCurrent || !plan.button_link}
                  onClick={() => {
                    if (!isCurrent && plan.button_link) {
                      window.open(plan.button_link, '_blank');
                    }
                  }}
                >
                  {isCurrent
                    ? 'Seu Plano Atual'
                    : (isUpgrade ? plan.button_text : 'Plano Inferior')
                  }
                  {!isCurrent && plan.button_link && isUpgrade && <ExternalLink className="ml-2 w-4 h-4" />}
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Aceitamos Pix, cartão e boleto
        </p>
        <p className="text-xs text-muted-foreground/60">
          🛡️ 7 dias de garantia incondicional. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
