import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MousePointerClick,
  Upload,
  Settings,
  ShoppingBag,
  CalendarDays,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { UserMenu } from './UserMenu';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarDays, label: 'Análise do Dia', path: '/analytics/day' },
  { icon: MousePointerClick, label: 'Análise de Cliques', path: '/analytics/clicks' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-card border-r border-white/10">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de navegação</SheetTitle>
        </SheetHeader>
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-shopee gradient-glow">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gradient-shopee">ShopeeDash</span>
            <span className="text-xs text-muted-foreground">Analytics Pro</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
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
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-3 bg-card">
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
