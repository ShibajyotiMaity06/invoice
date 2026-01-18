'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { clientsApi, invoicesApi } from '@/lib/api';
import { invoiceSchema, InvoiceFormDataSchema } from '@/lib/validations';
import { Client, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineItemsTable } from './LineItemsTable';
import { InvoiceSummary } from './InvoiceSummary';
import { InvoicePreview } from './InvoicePreview';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import { FileText, Save, Send } from 'lucide-react';
import { AxiosError } from 'axios';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  preselectedClientId?: string;
}

export function InvoiceForm({ invoice, preselectedClientId }: InvoiceFormProps) {
  const router = useRouter();
  const { workspace } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!invoice;
  const defaultPaymentTerms = workspace?.defaultPaymentTerms || 30;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormDataSchema>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: (typeof invoice?.client === 'object' ? invoice?.client?._id : invoice?.client) || preselectedClientId || '',
      issueDate: invoice?.issueDate
        ? format(new Date(invoice.issueDate), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      dueDate: invoice?.dueDate
        ? format(new Date(invoice.dueDate), 'yyyy-MM-dd')
        : format(addDays(new Date(), defaultPaymentTerms), 'yyyy-MM-dd'),
      lineItems: invoice?.lineItems?.length
        ? invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.taxRate || 0,
        }))
        : [{ description: '', quantity: 1, rate: 0, taxRate: 0 }],
      discountType: invoice?.discountType || 'fixed',
      discountValue: invoice?.discountValue || 0,
      notes: invoice?.notes || workspace?.defaultFooterNote || '',
      currency: invoice?.currency || workspace?.defaultCurrency || 'USD',
    },
  });

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientsApi.getAll({ limit: 100 });
        setClients(response.data.data.clients);
      } catch (error) {
        toast.error('Failed to load clients');
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const onSubmit = async (data: InvoiceFormDataSchema, status: 'draft' | 'sent' = 'draft') => {
    setIsSaving(true);
    try {
      // Filter out invalid line items (empty description or quantity <= 0)
      const validLineItems = data.lineItems.filter(
        item => item.description.trim() !== '' && item.quantity > 0
      );

      // Ensure at least one valid line item exists
      if (validLineItems.length === 0) {
        toast.error('Please add at least one line item with description and quantity');
        setIsSaving(false);
        return;
      }

      // Calculate amount and taxAmount for each line item
      const lineItemsWithCalculations = validLineItems.map(item => {
        const amount = item.quantity * item.rate;
        const taxAmount = (amount * (item.taxRate || 0)) / 100;
        return {
          ...item,
          amount,
          taxAmount,
        };
      });

      const payload = {
        ...data,
        lineItems: lineItemsWithCalculations,
        status,
      };

      if (isEditing && invoice) {
        await invoicesApi.update(invoice._id, payload);
        toast.success('Invoice updated successfully');
      } else {
        await invoicesApi.create(payload);
        toast.success(
          status === 'draft' ? 'Invoice saved as draft' : 'Invoice created successfully'
        );
      }
      router.push('/invoices');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = handleSubmit((data) => onSubmit(data, 'draft'));
  const handleSaveAndSend = handleSubmit((data) => onSubmit(data, 'sent'));

  const currency = watch('currency') || 'USD';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Client & Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                {isLoadingClients ? (
                  <div className="h-10 flex items-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <Select
                    value={watch('clientId')}
                    onValueChange={(value) => setValue('clientId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.clientId && (
                  <p className="text-sm text-destructive">{errors.clientId.message}</p>
                )}
              </div>

              {/* Issue Date */}
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input type="date" {...register('issueDate')} />
                {errors.issueDate && (
                  <p className="text-sm text-destructive">{errors.issueDate.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input type="date" {...register('dueDate')} />
                {errors.dueDate && (
                  <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Add products or services to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <LineItemsTable
              control={control}
              register={register}
              errors={errors}
              currency={currency}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional information for the client</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Payment instructions, terms, or thank you message..."
              {...register('notes')}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full sm:w-72">
            <InvoiceSummary watch={watch} setValue={setValue} currency={currency} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            <Button type="button" onClick={handleSaveAndSend} disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
              Save & Send
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="hidden lg:block">
        <InvoicePreview
          watch={watch}
          workspace={workspace}
          clients={clients}
          currency={currency}
        />
      </div>
    </div>
  );
}