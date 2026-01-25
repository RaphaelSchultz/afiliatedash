import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  MousePointerClick,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CalendarDays,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenu } from './UserMenu';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: BarChart3, label: 'Análise de Vendas', path: '/analytics/sales' },
  { icon: CalendarDays, label: 'Análise do Dia', path: '/analytics/day' },
  { icon: MousePointerClick, label: 'Análise de Cliques', path: '/analytics/clicks' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'glass-sidebar flex flex-col h-screen transition-all duration-300 sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-shopee gradient-glow">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gradient-shopee">ShopeeDash</span>
            <span className="text-xs text-muted-foreground">Analytics Pro</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive && 'text-primary'
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="bg-card border-border">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/5 p-3">
        <UserMenu collapsed={collapsed} />
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
