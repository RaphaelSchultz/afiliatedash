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
        'w-full lg:min-w-[280px] lg:w-auto lg:flex-none',
        className
      )}
      style={style}
    >
      <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <h3 className="text-xl lg:text-2xl font-bold text-foreground leading-tight whitespace-nowrap">
              {typeof value === 'string' && value.startsWith('R$') ? (
                <>
                  <span className="text-base lg:text-xl">R$</span>
                  {value.slice(2)}
                </>
              ) : (
                value
              )}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
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
          <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl gradient-shopee flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
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
    <div className={cn('w-full lg:min-w-[280px] lg:w-auto lg:flex-none', className)}>
      <div className="glass-card rounded-2xl p-6 h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse mt-3" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
