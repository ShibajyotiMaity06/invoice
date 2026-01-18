'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/dashboard/Header';
import { BusinessProfileForm } from '@/components/business-profile/BusinessProfileForm';
import { PageLoader } from '@/components/shared/LoadingSpinner';

export default function BusinessProfilePage() {
  const { workspace, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <Header title="Business Profile" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <BusinessProfileForm workspace={workspace} />
        </div>
      </main>
    </>
  );
}