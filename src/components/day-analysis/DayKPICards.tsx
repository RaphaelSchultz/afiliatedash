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
    <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1 truncate uppercase tracking-wider">
            {stat.label}
          </p>
          <h3 className="text-xl lg:text-2xl font-bold text-foreground truncate">
            {stat.value}
          </h3>
          {stat.subtext && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {stat.subtext}
            </p>
          )}
        </div>
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-br",
          stat.color
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
          <div className="h-6 w-28 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function DayKPICards({ stats, isLoading }: DayKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <KPICard stat={stat} />
        </div>
      ))}
    </div>
  );
}
