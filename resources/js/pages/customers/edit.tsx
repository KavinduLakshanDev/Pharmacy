import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';

export default function Edit() {
  const { t } = useTranslation();
  const { customer } = usePage().props as any;

  const [formData, setFormData] = useState({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    type: customer.type || 'customer',
    privileged_customer_number: customer.privileged_customer_number || '',
    current_balance: customer.current_balance || '0',
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
      ...(field === 'type' && value !== 'privileged_customer' ? { privileged_customer_number: '' } : {})
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await router.put(route('customers.update', customer.id), formData, {
        onSuccess: () => {
          toast.success(t('Customer updated successfully'));
          router.visit(route('customers.show', customer.id));
        },
        onError: (validationErrors) => {
          setErrors(validationErrors);
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.visit(route('customers.show', customer.id));
  };

  return (
    <PageTemplate 
      title={t('Edit Customer')} 
      description={t('Edit customer information')} 
      url="/customers/edit" 
      noPadding
      actions={[
        {
          label: t('Back'),
          icon: <ArrowLeft className="w-4 h-4" />,
          onClick: handleBack,
          variant: 'outline' as const,
        }
      ]}
    >
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>{t('Customer Information')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('Name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t('Enter customer name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">{t('Code')}</Label>
                  <Input
                    id="code"
                    value={customer.code || ''}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">{t('Code is auto-generated and cannot be edited')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {t('Phone')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('Enter customer phone')}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t('Email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('Enter customer email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_balance">{t('Current Balance')}</Label>
                  <Input
                    id="current_balance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => handleInputChange('current_balance', e.target.value)}
                    placeholder={t('Enter current balance')}
                    className={errors.current_balance ? 'border-red-500' : ''}
                  />
                  {errors.current_balance && (
                    <p className="text-sm text-red-500">{errors.current_balance}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{t('Type')}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder={t('Select type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">{t('Customer')}</SelectItem>
                      <SelectItem value="privileged_customer">{t('Privileged Customer')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type}</p>
                  )}
                </div>

                {formData.type === 'privileged_customer' && (
                  <div className="space-y-2">
                    <Label htmlFor="privileged_customer_number">
                      {t('Privileged Customer Number')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="privileged_customer_number"
                      value={formData.privileged_customer_number}
                      onChange={(e) => handleInputChange('privileged_customer_number', e.target.value)}
                      placeholder={t('Enter privileged customer number')}
                      className={errors.privileged_customer_number ? 'border-red-500' : ''}
                    />
                    {errors.privileged_customer_number && (
                      <p className="text-sm text-red-500">{errors.privileged_customer_number}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('Address')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('Enter customer address')}
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? t('Saving...') : t('Save Changes')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}