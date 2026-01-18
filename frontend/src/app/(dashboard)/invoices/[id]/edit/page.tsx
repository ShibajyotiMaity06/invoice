'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { invoicesApi } from '@/lib/api';
import { Invoice } from '@/types';
import { Header } from '@/components/dashboard/Header';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await invoicesApi.getOne(id);
        const inv = response.data.data.invoice;
        
        // Only allow editing draft invoices
        if (inv.status !== 'draft') {
          setError('Only draft invoices can be edited');
          return;
        }
        
        setInvoice(inv);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load invoice');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !invoice) {
    return (
      <>
        <Header title="Edit Invoice" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h3 className="mt-4 text-lg font-semibold">Cannot Edit Invoice</h3>
              <p className="mt-2 text-center text-muted-foreground">{error}</p>
              <Link href="/invoices" className="mt-4">
                <Button>Back to Invoices</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title={`Edit ${invoice.invoiceNumber}`} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Edit Invoice</h2>
          <p className="text-muted-foreground">
            Update invoice {invoice.invoiceNumber}
          </p>
        </div>
        <InvoiceForm invoice={invoice} />
      </main>
    </>
  );
}