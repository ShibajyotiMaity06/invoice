'use client';

import { useFieldArray, Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

interface LineItemsTableProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  currency?: string;
}

export function LineItemsTable({
  control,
  register,
  errors,
  currency = 'USD',
}: LineItemsTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const addLineItem = () => {
    append({ description: '', quantity: 1, rate: 0, taxRate: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Description</TableHead>
              <TableHead className="w-[15%]">Qty</TableHead>
              <TableHead className="w-[20%]">Rate</TableHead>
              <TableHead className="w-[15%]">Tax %</TableHead>
              <TableHead className="w-[10%] text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const quantity = parseFloat(control._formValues?.lineItems?.[index]?.quantity) || 0;
              const rate = parseFloat(control._formValues?.lineItems?.[index]?.rate) || 0;
              const amount = quantity * rate;

              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input
                      placeholder="Item description"
                      {...register(`lineItems.${index}.description`)}
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                    {errors.lineItems?.[index]?.description && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.lineItems[index].description?.message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1"
                      {...register(`lineItems.${index}.quantity`)}
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register(`lineItems.${index}.rate`)}
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0"
                      {...register(`lineItems.${index}.taxRate`)}
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(amount)}
                  </TableCell>
                  <TableCell>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" onClick={addLineItem}>
        <Plus className="mr-2 h-4 w-4" />
        Add Line Item
      </Button>

      {errors.lineItems?.message && (
        <p className="text-sm text-destructive">{errors.lineItems.message}</p>
      )}
    </div>
  );
}