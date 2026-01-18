'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/context/AuthContext';
import { businessProfileApi } from '@/lib/api';
import { businessProfileSchema, BusinessProfileFormData } from '@/lib/validations';
import { Workspace } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import { Upload, X, Building2 } from 'lucide-react';
import { AxiosError } from 'axios';

interface BusinessProfileFormProps {
  workspace?: Workspace | null;
  isOnboarding?: boolean;
}

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
];

const paymentTermsOptions = [
  { value: '7', label: 'Net 7 (7 days)' },
  { value: '14', label: 'Net 14 (14 days)' },
  { value: '30', label: 'Net 30 (30 days)' },
  { value: '45', label: 'Net 45 (45 days)' },
  { value: '60', label: 'Net 60 (60 days)' },
];

export function BusinessProfileForm({ workspace, isOnboarding = false }: BusinessProfileFormProps) {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(workspace?.logo?.url || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: workspace?.name || '',
      email: workspace?.email || '',
      phone: workspace?.phone || '',
      address: {
        street: workspace?.address?.street || '',
        city: workspace?.address?.city || '',
        state: workspace?.address?.state || '',
        zipCode: workspace?.address?.zipCode || '',
        country: workspace?.address?.country || 'United States',
      },
      taxId: workspace?.taxId || '',
      website: workspace?.website || '',
      invoicePrefix: workspace?.invoicePrefix || 'INV',
      defaultCurrency: workspace?.defaultCurrency || 'USD',
      defaultPaymentTerms: workspace?.defaultPaymentTerms || 30,
      defaultFooterNote: workspace?.defaultFooterNote || '',
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = async (data: BusinessProfileFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Append all form fields
      formData.append('name', data.name);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      if (data.taxId) formData.append('taxId', data.taxId);
      if (data.website) formData.append('website', data.website);
      if (data.invoicePrefix) formData.append('invoicePrefix', data.invoicePrefix);
      if (data.defaultCurrency) formData.append('defaultCurrency', data.defaultCurrency);
      if (data.defaultPaymentTerms) formData.append('defaultPaymentTerms', String(data.defaultPaymentTerms));
      if (data.defaultFooterNote) formData.append('defaultFooterNote', data.defaultFooterNote);
      
      // Append address fields
      if (data.address) {
        Object.entries(data.address).forEach(([key, value]) => {
          if (value) formData.append(`address[${key}]`, value);
        });
      }

      // Append logo file
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (workspace) {
        await businessProfileApi.update(formData);
        toast.success('Business profile updated successfully');
      } else {
        await businessProfileApi.create(formData);
        toast.success('Business profile created successfully');
      }

      await refreshUser();

      if (isOnboarding) {
        router.push('/dashboard');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to save business profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo (PNG, JPG, max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-24 w-24 rounded-lg border object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={removeLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              <p>Drag and drop your logo here, or click to browse.</p>
              <p className="mt-1">Recommended: Square image, at least 200x200px.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            This information will appear on your invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="billing@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                {...register('phone')}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                {...register('website')}
                disabled={isLoading}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / VAT Number</Label>
              <Input
                id="taxId"
                placeholder="XX-XXXXXXX"
                {...register('taxId')}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              placeholder="123 Main Street"
              {...register('address.street')}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="San Francisco"
                {...register('address.city')}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                placeholder="CA"
                {...register('address.state')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP / Postal Code</Label>
              <Input
                id="zipCode"
                placeholder="94102"
                {...register('address.zipCode')}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="United States"
                {...register('address.country')}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
          <CardDescription>
            Default settings for new invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                placeholder="INV"
                {...register('invoicePrefix')}
                disabled={isLoading}
              />
              {errors.invoicePrefix && (
                <p className="text-sm text-destructive">{errors.invoicePrefix.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select
                value={watch('defaultCurrency')}
                onValueChange={(value) => setValue('defaultCurrency', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTerms">Payment Terms</Label>
              <Select
                value={String(watch('defaultPaymentTerms'))}
                onValueChange={(value) => setValue('defaultPaymentTerms', parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultFooterNote">Default Footer Note</Label>
            <Textarea
              id="defaultFooterNote"
              placeholder="Thank you for your business!"
              {...register('defaultFooterNote')}
              disabled={isLoading}
              rows={3}
            />
            {errors.defaultFooterNote && (
              <p className="text-sm text-destructive">{errors.defaultFooterNote.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        {!isOnboarding && (
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : isOnboarding ? (
            'Continue to Dashboard'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}