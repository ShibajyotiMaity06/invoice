'use client';

import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client') || undefined;

  return (
    <>
      <Header title="Create Invoice" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">New Invoice</h2>
          <p className="text-muted-foreground">
            Create and send a new invoice to your client
          </p>
        </div>
        <InvoiceForm preselectedClientId={clientId} />
      </main>
    </>
  );
}