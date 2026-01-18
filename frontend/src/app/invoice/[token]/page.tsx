'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { invoicesApi } from '@/lib/api';
import { Invoice, Workspace, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Globe,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' },
  sent: { color: 'bg-blue-100 text-blue-800', icon: Mail, label: 'Sent' },
  viewed: { color: 'bg-purple-100 text-purple-800', icon: FileText, label: 'Viewed' },
  paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Paid' },
  overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Overdue' },
  cancelled: { color: 'bg-gray-100 text-gray-500', icon: AlertCircle, label: 'Cancelled' },
};

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await invoicesApi.getPublic(token);
        setInvoice(response.data.data.invoice);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invoice not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (isLoading) {
    return <InvoiceLoadingSkeleton />;
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Invoice Not Found</h1>
            <p className="mt-2 text-center text-muted-foreground">
              {error || 'This invoice link may be invalid or expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const workspace = invoice.workspace as Workspace;
  const client = invoice.client as Client;
  const status = statusConfig[invoice.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const isPayable = ['sent', 'viewed', 'overdue'].includes(invoice.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge className={status.color} variant="secondary">
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {invoice.status === 'overdue' && (
                <span className="text-sm text-red-600 font-medium">
                  Overdue by {Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {isPayable && invoice.amountDue > 0 && (
              <Button size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatCurrency(invoice.amountDue, invoice.currency)}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            {/* Business Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {workspace?.logo?.url ? (
                  <img
                    src={workspace.logo.url}
                    alt={workspace.name}
                    className="h-16 w-16 object-contain rounded-lg"
                  />
                ) : (
                  <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{workspace?.name}</h1>
                  {workspace?.address && (
                    <div className="mt-1 text-sm text-muted-foreground flex items-start gap-1">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        {workspace.address.street && <div>{workspace.address.street}</div>}
                        <div>
                          {[workspace.address.city, workspace.address.state, workspace.address.zipCode]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                        {workspace.address.country && <div>{workspace.address.country}</div>}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {workspace?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${workspace.email}`} className="hover:text-foreground">
                          {workspace.email}
                        </a>
                      </div>
                    )}
                    {workspace?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${workspace.phone}`} className="hover:text-foreground">
                          {workspace.phone}
                        </a>
                      </div>
                    )}
                    {workspace?.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a
                          href={workspace.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground"
                        >
                          {workspace.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <h2 className="text-3xl sm:text-4xl font-bold text-primary">INVOICE</h2>
                <div className="mt-2 text-lg font-semibold">{invoice.invoiceNumber}</div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Bill To & Dates */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Bill To
                </h3>
                <div className="mt-3">
                  <div className="text-lg font-semibold">{client?.name}</div>
                  {client?.address && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {client.address.street && <div>{client.address.street}</div>}
                      <div>
                        {[client.address.city, client.address.state, client.address.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      {client.address.country && <div>{client.address.country}</div>}
                    </div>
                  )}
                  {client?.email && (
                    <div className="mt-2 text-sm text-muted-foreground">{client.email}</div>
                  )}
                </div>
              </div>

              <div className="sm:text-right">
                <div className="inline-grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span className="font-medium">
                    {format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}
                  </span>
                  <span className="text-muted-foreground">Due Date</span>
                  <span className={`font-medium ${invoice.status === 'overdue' ? 'text-red-600' : ''}`}>
                    {format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Line Items - Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th className="pb-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="pb-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="pb-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="pb-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4">
                        <div className="font-medium">{item.description}</div>
                      </td>
                      <td className="py-4 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="py-4 text-right text-muted-foreground">
                        {formatCurrency(item.rate, invoice.currency)}
                      </td>
                      <td className="py-4 text-right text-muted-foreground">
                        {item.taxRate || 0}%
                      </td>
                      <td className="py-4 text-right font-medium">
                        {formatCurrency(item.amount || item.quantity * item.rate, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Line Items - Mobile */}
            <div className="sm:hidden space-y-4">
              {invoice.lineItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="font-medium">{item.description}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Quantity</div>
                    <div className="text-right">{item.quantity}</div>
                    <div className="text-muted-foreground">Rate</div>
                    <div className="text-right">{formatCurrency(item.rate, invoice.currency)}</div>
                    {(item.taxRate || 0) > 0 && (
                      <>
                        <div className="text-muted-foreground">Tax</div>
                        <div className="text-right">{item.taxRate}%</div>
                      </>
                    )}
                    <div className="font-medium pt-2 border-t">Amount</div>
                    <div className="text-right font-medium pt-2 border-t">
                      {formatCurrency(item.amount || item.quantity * item.rate, invoice.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-full sm:w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </span>
                </div>
                {invoice.taxTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.taxTotal, invoice.currency)}
                    </span>
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
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid</span>
                      <span>-{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Amount Due</span>
                      <span className={invoice.status === 'overdue' ? 'text-red-600' : ''}>
                        {formatCurrency(invoice.amountDue, invoice.currency)}
                      </span>
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
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Notes
                  </h3>
                  <p className="mt-3 text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </>
            )}

            {/* Payment Button - Mobile Sticky */}
            {isPayable && invoice.amountDue > 0 && (
              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                <Button className="w-full" size="lg">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {formatCurrency(invoice.amountDue, invoice.currency)}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <a href="/" className="text-primary hover:underline font-medium">
              Invoicely
            </a>
          </p>
        </div>

        {/* Spacer for mobile sticky button */}
        {isPayable && invoice.amountDue > 0 && <div className="sm:hidden h-20" />}
      </div>
    </div>
  );
}

function InvoiceLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-8">
            <div className="flex justify-between">
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-10 w-40 ml-auto" />
                <Skeleton className="h-5 w-28 ml-auto" />
              </div>
            </div>
            <Separator />
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-2 sm:text-right">
                <Skeleton className="h-4 w-32 sm:ml-auto" />
                <Skeleton className="h-4 w-32 sm:ml-auto" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-end">
              <div className="space-y-2 w-72">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}