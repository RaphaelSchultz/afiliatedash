import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  style?: CSSProperties;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  style,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group',
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1 truncate">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold text-foreground truncate">
            {value}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 w-12 h-12 rounded-xl gradient-shopee flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

interface KPICardSkeletonProps {
  className?: string;
}

export function KPICardSkeleton({ className }: KPICardSkeletonProps) {
  return (
    <div className={cn('glass-card rounded-2xl p-6', className)}>
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
