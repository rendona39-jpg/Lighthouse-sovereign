'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/theme-context';
import {
  Home,
  MessageSquare,
  BarChart3,
  FolderOpen,
  Settings,
  Sun,
  Moon,
  Menu,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  hasData?: boolean;
}

const navItems = [
  { icon: Home, label: 'Overview', href: '/overview' },
  { icon: MessageSquare, label: 'Chat', href: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics', requiresData: true },
  { icon: FolderOpen, label: 'Files', href: '/files' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar({ hasData = true }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 bottom-0 w-[60px] bg-secondary border-r border-border flex flex-col z-40">
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-center border-b border-border">
          <Link href="/dashboard" className="p-2 hover:bg-hover rounded-lg transition-colors">
            <Compass className="h-5 w-5 text-foreground" />
          </Link>
        </div>

        {/* Menu Toggle */}
        <div className="py-4 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Menu</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isLocked = item.requiresData && !hasData;
            const Icon = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={isLocked ? '#' : item.href}
                    className={cn(
                      'relative flex items-center justify-center h-10 w-10 rounded-lg transition-colors',
                      isActive && 'bg-hover',
                      isLocked
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-hover hover:text-foreground',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    onClick={(e) => isLocked && e.preventDefault()}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-foreground rounded-r" />
                    )}
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isLocked ? `${item.label} (Upload data first)` : item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="py-4 flex justify-center border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
