import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MousePointerClick,
  Upload,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CalendarDays,
  Link2,
  BarChart3,
  ChevronDown,
  HelpCircle,
  Menu
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { HelpCenterModal } from '@/components/modals/HelpCenterModal';

interface SubMenuItem {
  label: string;
  path: string;
  icon?: any;
}

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarDays, label: 'Análise do Dia', path: '/analytics/day' },
  { icon: MousePointerClick, label: 'Análise de Cliques', path: '/analytics/clicks' },
  {
    icon: Link2,
    label: 'Meus Links',
    subItems: [
      { label: 'Gerenciar Links', path: '/links', icon: Link2 },
      { label: 'Analytics Links', path: '/analytics/links', icon: BarChart3 }
    ]
  },
  { icon: Upload, label: 'Upload', path: '/upload' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();

  // State for expanded menus (using label as key)
  // Initialize based on current path to auto-open if active
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const active = menuItems.find(item =>
      item.subItems?.some(sub => sub.path === location.pathname)
    );
    return active ? [active.label] : [];
  });

  // Auto-expand menu when navigating to a sub-item
  useEffect(() => {
    const active = menuItems.find(item =>
      item.subItems?.some(sub => sub.path === location.pathname)
    );
    if (active) {
      setOpenMenus(prev => prev.includes(active.label) ? prev : [...prev, active.label]);
    }
  }, [location.pathname]);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isMenuOpen = (label: string) => openMenus.includes(label);

  const isPathActive = (path?: string) => path === location.pathname;

  const isParentActive = (item: MenuItem) => {
    if (item.path && isPathActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isPathActive(sub.path));
    }
    return false;
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen transition-all duration-300 sticky top-0 z-50 bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        "relative flex items-center gap-3 py-6 border-b border-sidebar-border",
        collapsed ? "justify-center px-0" : "px-6"
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-shopee gradient-glow">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Afiliate Dash</span>
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors z-20"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = isParentActive(item);
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;

          if (hasSubItems) {
            if (collapsed) {
              // Collapsed State: Dropdown
              return (
                <DropdownMenu key={item.label}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full justify-center',
                            isActive
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                          )}
                        >
                          <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive && 'text-primary')} />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-card border-border">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent side="right" align="start" className="w-48 bg-card border-border ml-2">
                    <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.subItems!.map((sub) => {
                      const SubIcon = sub.icon || Link2; // Default icon
                      return (
                        <DropdownMenuItem key={sub.path} asChild>
                          <Link to={sub.path} className={cn("flex items-center cursor-pointer", isPathActive(sub.path) && "bg-primary/10 text-primary")}>
                            <SubIcon className="mr-2 h-4 w-4" />
                            <span>{sub.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            } else {
              // Expanded State: Collapsible
              return (
                <Collapsible
                  key={item.label}
                  open={isMenuOpen(item.label)}
                  onOpenChange={() => toggleMenu(item.label)}
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive && 'text-primary')} />
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isMenuOpen(item.label) ? "transform rotate-180" : ""
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1 space-y-1">
                    {item.subItems!.map((sub) => {
                      const SubIcon = sub.icon;
                      return <Link
                        key={sub.path}
                        to={sub.path}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                          isPathActive(sub.path)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        )}
                      >
                        {SubIcon && <SubIcon className="w-5 h-5" />}
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }
          }

          // Single Item Rendering
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path!}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                    collapsed && 'justify-center'
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

      {/* Theme Toggle & Help */}
      <div className={cn(
        "p-3 flex gap-2",
        collapsed ? "flex-col" : "flex-row"
      )}>
        <ThemeToggle
          collapsed={true}
          className={cn(
            collapsed ? "w-full" : "w-10 px-0 justify-center flex-shrink-0"
          )}
        />

        <button
          onClick={() => setHelpOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-xl p-3 transition-colors bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border",
            collapsed ? "w-full justify-center" : "flex-1"
          )}
          title="Central de Ajuda"
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          {!collapsed && (
            <span className="text-sm font-bold text-foreground">Ajuda</span>
          )}
        </button>
      </div>

      <HelpCenterModal open={helpOpen} onOpenChange={setHelpOpen} />

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
