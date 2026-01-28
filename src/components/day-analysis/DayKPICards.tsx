import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardData {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color: string;
}

interface DayKPICardsProps {
  stats: KPICardData[];
  isLoading?: boolean;
}

function KPICard({ stat }: { stat: KPICardData }) {
  const Icon = stat.icon;

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {stat.label}
          </p>
          <h3 className="text-xl lg:text-2xl font-bold text-foreground leading-tight whitespace-nowrap">
            {typeof stat.value === 'string' && stat.value.startsWith('R$') ? (
              <>
                <span className="text-base lg:text-xl">R$</span>
                {stat.value.slice(2)}
              </>
            ) : (
              stat.value
            )}
          </h3>
          {stat.subtext && (
            <p className="text-sm text-muted-foreground mt-1">
              {stat.subtext}
            </p>
          )}
        </div>
        <div className={cn(
          "flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-br",
          stat.color
        )}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-20 bg-muted rounded animate-pulse mt-3" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function DayKPICards({ stats, isLoading }: DayKPICardsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-full lg:w-[280px] lg:flex-none">
            <KPICardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="w-full lg:min-w-[280px] lg:max-w-[320px] lg:flex-1 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <KPICard stat={stat} />
        </div>
      ))}
    </div>
  );
}
