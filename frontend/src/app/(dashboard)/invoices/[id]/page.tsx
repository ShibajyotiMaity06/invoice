'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { invoicesApi } from '@/lib/api';
import { Invoice } from '@/types';
import { Header } from '@/components/dashboard/Header';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Send,
  Trash2,
  Download,
  Copy,
  AlertCircle,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const { workspace } = useAuth();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      const response = await invoicesApi.getOne(id);
      setInvoice(response.data.data.invoice);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await invoicesApi.delete(id);
      toast.success('Invoice deleted successfully');
      router.push('/invoices');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      await invoicesApi.update(id, { status: 'sent' });
      toast.success('Invoice marked as sent');
      fetchInvoice();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invoice');
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !invoice) {
    return (
      <>
        <Header title="Invoice" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h3 className="mt-4 text-lg font-semibold">Invoice Not Found</h3>
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

  const client = typeof invoice.client === 'object' ? invoice.client : null;

  return (
    <>
      <Header title={`Invoice ${invoice.invoiceNumber}`} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-wrap gap-2">
            {invoice.status === 'draft' && (
              <>
                <Link href={`/invoices/${id}/edit`}>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button onClick={handleSendInvoice}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
            {invoice.status !== 'draft' && (
  <>
    <Button
      variant="outline"
      onClick={() => {
        const url = `${window.location.origin}/invoice/${invoice.accessToken}`;
        navigator.clipboard.writeText(url);
        toast.success('Invoice link copied to clipboard');
      }}
    >
      <Copy className="mr-2 h-4 w-4" />
      Copy Link
    </Button>
    <Button variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  </>
)}
          </div>
        </div>

        {/* Invoice Preview */}
        <Card className="mx-auto max-w-4xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
              <div>
                {workspace?.logo?.url ? (
                  <img
                    src={workspace.logo.url}
                    alt={workspace.name}
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{workspace?.name}</h2>
                )}
                {workspace?.logo?.url && (
                  <h2 className="mt-2 text-xl font-bold">{workspace?.name}</h2>
                )}
                {workspace?.address && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {workspace.address.street && <div>{workspace.address.street}</div>}
                    <div>
                      {workspace.address.city}
                      {workspace.address.city && workspace.address.state && ', '}
                      {workspace.address.state} {workspace.address.zipCode}
                    </div>
                    {workspace.address.country && <div>{workspace.address.country}</div>}
                  </div>
                )}
                {workspace?.email && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {workspace.email}
                  </div>
                )}
              </div>

              <div className="text-right">
                <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                <div className="mt-2 text-lg font-semibold">{invoice.invoiceNumber}</div>
                <Badge className={`mt-2 ${statusColors[invoice.status]}`} variant="secondary">
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Bill To & Dates */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">BILL TO</h3>
                {client && (
                  <div className="mt-2">
                    <div className="font-semibold">{client.name}</div>
                    {client.address && (
                      <div className="text-sm text-muted-foreground">
                        {client.address.street && <div>{client.address.street}</div>}
                        <div>
                          {client.address.city}
                          {client.address.city && client.address.state && ', '}
                          {client.address.state} {client.address.zipCode}
                        </div>
                        {client.address.country && <div>{client.address.country}</div>}
                      </div>
                    )}
                    {client.email && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {client.email}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:text-right">
                <div className="grid grid-cols-2 gap-2 text-sm sm:inline-grid">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">
                    {format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}
                  </span>
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">
                    {format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Line Items */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-semibold text-muted-foreground">
                    <th className="pb-3">Description</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Rate</th>
                    <th className="pb-3 text-right">Tax</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-4">{item.description}</td>
                      <td className="py-4 text-right">{item.quantity}</td>
                      <td className="py-4 text-right">
                        {formatCurrency(item.rate, invoice.currency)}
                      </td>
                      <td className="py-4 text-right">{item.taxRate || 0}%</td>
                      <td className="py-4 text-right font-medium">
                        {formatCurrency(item.amount || 0, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.taxTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
                  </div>
                )}
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                {invoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid</span>
                      <span>-{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Amount Due</span>
                      <span>{formatCurrency(invoice.amountDue, invoice.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <>
                <Separator className="my-8" />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">NOTES</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{invoice.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete invoice {invoice.invoiceNumber}? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </>
  );
}