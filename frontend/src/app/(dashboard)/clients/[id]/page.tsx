'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';
import { ClientForm } from '@/components/clients/ClientForm';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useClient } from '@/hooks/useClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditClientPage() {
  const params = useParams();
  const id = params.id as string;
  const { client, isLoading, error } = useClient(id);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !client) {
    return (
      <>
        <Header title="Edit Client" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h3 className="mt-4 text-lg font-semibold">Client Not Found</h3>
              <p className="mt-2 text-center text-muted-foreground">
                {error || "The client you're looking for doesn't exist."}
              </p>
              <Link href="/clients" className="mt-4">
                <Button>Back to Clients</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title={`Edit: ${client.name}`} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Edit Client</h2>
            <p className="text-muted-foreground">
              Update your client&apos;s information
            </p>
          </div>
          <ClientForm client={client} />
        </div>
      </main>
    </>
  );
}