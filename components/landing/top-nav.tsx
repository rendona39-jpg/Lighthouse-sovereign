'use client';

import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopNavProps {
  onSignInClick: () => void;
  onGetStartedClick: () => void;
}

export function TopNav({ onSignInClick, onGetStartedClick }: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Lighthouse</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onSignInClick}
            className="text-[15px] text-muted-foreground hover:text-foreground"
          >
            Sign In
          </Button>
          <Button
            onClick={onGetStartedClick}
            className="text-[15px] bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
