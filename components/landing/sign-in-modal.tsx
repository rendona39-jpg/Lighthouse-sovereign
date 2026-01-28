'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp: () => void;
}

export function SignInModal({ open, onOpenChange, onSwitchToSignUp }: SignInModalProps) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(formData);
      onOpenChange(false);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] rounded-2xl p-8 bg-card border-border">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Sign In
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 hover:bg-hover transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label htmlFor="signin-email" className="text-[13px] font-medium text-foreground">
              Email
            </Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="john@business.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="h-11 bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signin-password" className="text-[13px] font-medium text-foreground">
              Password
            </Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              className="h-11 bg-background border-border"
            />
          </div>

          <button
            type="button"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </button>

          {error && (
            <p className="text-[13px] text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <p className="text-center text-[13px] text-muted-foreground">
            {"Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onSwitchToSignUp();
              }}
              className="text-foreground font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
