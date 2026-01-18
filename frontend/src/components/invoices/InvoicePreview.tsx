'use client';

import { UseFormWatch } from 'react-hook-form';
import { Client, Workspace } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface InvoicePreviewProps {
  watch: UseFormWatch<any>;
  workspace: Workspace | null;
  clients: Client[];
  currency?: string;
}

export function InvoicePreview({
  watch,
  workspace,
  clients,
  currency = 'USD',
}: InvoicePreviewProps) {
  const clientId = watch('clientId');
  const issueDate = watch('issueDate');
  const dueDate = watch('dueDate');
  const lineItems = watch('lineItems') || [];
  const discountType = watch('discountType') || 'fixed';
  const discountValue = parseFloat(watch('discountValue')) || 0;
  const notes = watch('notes');

  const client = clients.find((c) => c._id === clientId);

  // Calculations
  const subtotal = lineItems.reduce((sum: number, item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + qty * rate;
  }, 0);

  const taxTotal = lineItems.reduce((sum: number, item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    return sum + (qty * rate * taxRate) / 100;
  }, 0);

  const discountAmount =
    discountType === 'percentage'
      ? (subtotal * discountValue) / 100
      : discountValue;

  const total = subtotal + taxTotal - discountAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return '—';
    }
  };

  return (
    <Card className="sticky top-6">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between">
            <div>
              {workspace?.logo?.url ? (
                <img
                  src={workspace.logo.url}
                  alt={workspace.name}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <div className="text-xl font-bold">{workspace?.name || 'Your Business'}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">INVOICE</div>
              <div className="text-sm text-muted-foreground">Draft</div>
            </div>
          </div>

          <Separator />

          {/* From / To */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-semibold text-muted-foreground mb-1">From</div>
              <div className="font-medium">{workspace?.name}</div>
              {workspace?.address?.street && <div>{workspace.address.street}</div>}
              {(workspace?.address?.city || workspace?.address?.state) && (
                <div>
                  {workspace?.address?.city}
                  {workspace?.address?.city && workspace?.address?.state ? ', ' : ''}
                  {workspace?.address?.state} {workspace?.address?.zipCode}
                </div>
              )}
              {workspace?.email && <div>{workspace.email}</div>}
            </div>
            <div>
              <div className="font-semibold text-muted-foreground mb-1">Bill To</div>
              {client ? (
                <>
                  <div className="font-medium">{client.name}</div>
                  {client.address?.street && <div>{client.address.street}</div>}
                  {(client.address?.city || client.address?.state) && (
                    <div>
                      {client.address?.city}
                      {client.address?.city && client.address?.state ? ', ' : ''}
                      {client.address?.state} {client.address?.zipCode}
                    </div>
                  )}
                  {client.email && <div>{client.email}</div>}
                </>
              ) : (
                <div className="text-muted-foreground italic">Select a client</div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Issue Date: </span>
              <span className="font-medium">{formatDate(issueDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date: </span>
              <span className="font-medium">{formatDate(dueDate)}</span>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>
            {lineItems.map((item: any, index: number) => {
              const qty = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.rate) || 0;
              const amount = qty * rate;
              return (
                <div key={index} className="grid grid-cols-12 gap-2 text-sm">
                  <div className="col-span-5 truncate">
                    {item.description || <span className="text-muted-foreground italic">No description</span>}
                  </div>
                  <div className="col-span-2 text-right">{qty}</div>
                  <div className="col-span-2 text-right">{formatCurrency(rate)}</div>
                  <div className="col-span-3 text-right font-medium">{formatCurrency(amount)}</div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <>
              <Separator />
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Notes</div>
                <div className="text-sm whitespace-pre-wrap">{notes}</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}