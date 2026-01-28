'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    role: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signUp(formData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-[13px] font-medium text-foreground">
          Full Name
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Smith"
          value={formData.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          required
          className="h-11 bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[13px] font-medium text-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@business.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          required
          className="h-11 bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[13px] font-medium text-foreground">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          required
          minLength={8}
          className="h-11 bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-[13px] font-medium text-foreground">
          Business Name
        </Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Acme Corp"
          value={formData.businessName}
          onChange={(e) => updateField('businessName', e.target.value)}
          required
          className="h-11 bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-[13px] font-medium text-foreground">
          Your Role
        </Label>
        <Select value={formData.role} onValueChange={(value) => updateField('role', value)}>
          <SelectTrigger className="h-11 bg-background border-border">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Owner">Owner</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-[13px] font-medium text-foreground">
          Location
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="e.g., New York, NY"
          value={formData.location}
          onChange={(e) => updateField('location', e.target.value)}
          required
          className="h-11 bg-background border-border"
        />
      </div>

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
            Creating account...
          </>
        ) : (
          'Get Started'
        )}
      </Button>
    </form>
  );
}
