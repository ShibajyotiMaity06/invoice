'use client';

import { useAuth } from '@/context/AuthContext';
import { BusinessProfileForm } from '@/components/business-profile/BusinessProfileForm';
import { Logo } from '@/components/shared/Logo';
import { PageLoader } from '@/components/shared/LoadingSpinner';

export default function OnboardingPage() {
  const { isLoading, workspace } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-muted/50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 text-2xl font-bold">Set up your business profile</h1>
          <p className="mt-2 text-muted-foreground">
            This information will appear on your invoices
          </p>
        </div>
        <BusinessProfileForm workspace={workspace} isOnboarding={true} />
      </div>
    </div>
  );
}