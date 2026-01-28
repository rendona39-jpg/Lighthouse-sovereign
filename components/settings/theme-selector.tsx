'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
        <div className="h-8 w-20 bg-background rounded animate-pulse" />
        <div className="h-8 w-20 bg-background rounded animate-pulse" />
        <div className="h-8 w-24 bg-background rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3',
          theme === 'dark' && 'bg-background'
        )}
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-4 w-4 mr-1" />
        Dark
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3',
          theme === 'light' && 'bg-background'
        )}
        onClick={() => setTheme('light')}
      >
        <Sun className="h-4 w-4 mr-1" />
        Light
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3',
          theme === 'system' && 'bg-background'
        )}
        onClick={() => setTheme('system')}
      >
        <Monitor className="h-4 w-4 mr-1" />
        System
      </Button>
    </div>
  );
}
