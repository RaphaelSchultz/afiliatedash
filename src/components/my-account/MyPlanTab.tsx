import { Check, Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    price: 'R$89',
    originalPrice: 'R$178',
    description: 'Perfeito para começar',
    features: [
      'Dashboard básico',
      'Upload de CSV',
      'Relatórios simples',
      'Suporte por e-mail',
    ],
    current: false,
  },
  {
    name: 'Pro',
    price: 'R$129',
    originalPrice: 'R$258',
    description: 'Para afiliados sérios',
    features: [
      'Tudo do Starter, mais:',
      'Análise de ROI',
      'Múltiplas credenciais API',
      'Filtros avançados',
      'Exportação de dados',
    ],
    current: false,
    highlighted: true,
  },
  {
    name: 'Elite',
    price: 'R$249',
    originalPrice: 'R$498',
    description: 'Para agências e escala',
    features: [
      'Tudo do Pro, mais:',
      'API ilimitada',
      'Relatórios personalizados',
      'Suporte prioritário',
      'White-label',
    ],
    current: true,
  },
];

const currentPlanFeatures = [
  'API ilimitada',
  'Relatórios personalizados',
  'Suporte prioritário',
  'White-label',
];

export function MyPlanTab() {
  const currentPlan = plans.find(p => p.current);

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
              <h2 className="text-2xl font-bold text-foreground">{currentPlan?.name}</h2>
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
          {currentPlanFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Title */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">
          Seu Plano {currentPlan?.name} - Acesso Completo
        </h3>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'glass-card rounded-2xl p-5 border transition-all',
              plan.current 
                ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-transparent' 
                : 'border-white/10 hover:border-white/20',
              plan.highlighted && !plan.current && 'border-blue-500/30'
            )}
          >
            {plan.current && (
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
                <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
              </div>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {plan.description}
            </p>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className={cn(
                    "w-4 h-4 flex-shrink-0 mt-0.5",
                    plan.current ? "text-green-400" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    plan.current ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              variant={plan.current ? 'outline' : 'default'}
              className={cn(
                'w-full',
                plan.current && 'border-primary/50 text-muted-foreground cursor-default',
                !plan.current && plan.highlighted && 'gradient-shopee text-white',
                !plan.current && !plan.highlighted && 'bg-secondary text-foreground hover:bg-secondary/80'
              )}
              disabled={plan.current}
            >
              {plan.current ? 'Seu Plano Atual' : 'Plano Inferior'}
            </Button>
          </div>
        ))}
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
