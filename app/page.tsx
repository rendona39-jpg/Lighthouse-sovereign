'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { TopNav } from '@/components/landing/top-nav';
import { SignUpForm } from '@/components/landing/sign-up-form';
import { SignInModal } from '@/components/landing/sign-in-modal';
import { BlurredPreview } from '@/components/landing/blurred-preview';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const scrollToForm = () => {
    const formSection = document.getElementById('signup-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav 
        onSignInClick={() => setShowSignIn(true)} 
        onGetStartedClick={scrollToForm}
      />

      {/* Main Content */}
      <div className="pt-16 min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Sign Up Form */}
        <div 
          id="signup-form"
          className="w-full lg:w-[440px] flex-shrink-0 bg-secondary border-r border-border"
        >
          <div className="p-8 lg:p-12 lg:sticky lg:top-16">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Create your account
              </h1>
              <p className="text-[15px] text-muted-foreground">
                Start getting AI-powered insights for your business in minutes.
              </p>
            </div>

            <SignUpForm />

            <p className="mt-6 text-center text-[13px] text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setShowSignIn(true)}
                className="text-foreground font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Right Panel - Blurred Dashboard Preview */}
        <div className="flex-1 min-h-[600px] lg:min-h-0 bg-background relative">
          <BlurredPreview />
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal
        open={showSignIn}
        onOpenChange={setShowSignIn}
        onSwitchToSignUp={() => {
          setShowSignIn(false);
          scrollToForm();
        }}
      />
    </div>
  );
}
