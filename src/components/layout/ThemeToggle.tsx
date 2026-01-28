import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  if (!mounted) {
    return (
      <button
        className={cn(
          'flex items-center gap-3 w-full rounded-xl p-3 transition-colors bg-secondary/50 hover:bg-secondary',
          collapsed && 'justify-center'
        )}
        disabled
      >
        <Moon className="h-5 w-5 text-muted-foreground" />
        {!collapsed && <span className="text-sm font-medium text-muted-foreground">Tema</span>}
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center gap-3 w-full rounded-xl p-3 transition-colors bg-secondary/50 hover:bg-secondary',
        collapsed && 'justify-center'
      )}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-muted-foreground transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-muted-foreground transition-all" />
      )}
      {!collapsed && (
        <span className="text-sm font-medium text-foreground">
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  );
}
