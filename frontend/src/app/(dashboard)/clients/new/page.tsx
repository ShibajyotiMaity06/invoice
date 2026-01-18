'use client';

import { Header } from '@/components/dashboard/Header';
import { ClientForm } from '@/components/clients/ClientForm';

export default function NewClientPage() {
  return (
    <>
      <Header title="Add Client" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Add New Client</h2>
            <p className="text-muted-foreground">
              Enter your client&apos;s details below
            </p>
          </div>
          <ClientForm />
        </div>
      </main>
    </>
  );
}