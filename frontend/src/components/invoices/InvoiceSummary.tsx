'use client';

import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface InvoiceSummaryProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  currency?: string;
}

export function InvoiceSummary({ watch, setValue, currency = 'USD' }: InvoiceSummaryProps) {
  const lineItems = watch('lineItems') || [];
  const discountType = watch('discountType') || 'fixed';
  const discountValue = parseFloat(watch('discountValue')) || 0;

  // Calculate subtotal
  const subtotal = lineItems.reduce((sum: number, item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + qty * rate;
  }, 0);

  // Calculate tax
  const taxTotal = lineItems.reduce((sum: number, item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    const amount = qty * rate;
    return sum + (amount * taxRate) / 100;
  }, 0);

  // Calculate discount
  const discountAmount =
    discountType === 'percentage'
      ? (subtotal * discountValue) / 100
      : discountValue;

  // Calculate total
  const total = subtotal + taxTotal - discountAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>

      {/* Tax */}
      {taxTotal > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="font-medium">{formatCurrency(taxTotal)}</span>
        </div>
      )}

      {/* Discount */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Discount</Label>
        <div className="flex gap-2">
          <Select
            value={discountType}
            onValueChange={(value) => setValue('discountType', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed ($)</SelectItem>
              <SelectItem value="percentage">Percent (%)</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={discountValue || ''}
            onChange={(e) => setValue('discountValue', e.target.value)}
            className="w-[100px]"
          />
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount Applied</span>
            <span className="font-medium text-green-600">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Total */}
      <div className="flex justify-between">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-bold">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}