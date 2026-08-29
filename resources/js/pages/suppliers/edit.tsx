import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';

export default function EditSupplier() {
  const { t } = useTranslation();
  const { supplier } = usePage().props as any;

  const [formData, setFormData] = useState({
    company_name: supplier.company_name || '',
    address: supplier.address || '',
    tel_no: supplier.tel_no || '',
    mail: supplier.mail || '',
    website: supplier.website || '',
    vat_registered: supplier.vat_registered || 'not_registered',
    vat_no: supplier.vat_no || '',
    contact_person_name: supplier.contact_person_name || '',
    contact_no: supplier.contact_no || '',
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const digitsOnlyFields = new Set(['tel_no', 'contact_no', 'vat_no']);
    const limitedDigitsFields = new Set(['tel_no', 'contact_no']);

    let normalizedValue = value;

    if (digitsOnlyFields.has(field)) {
      normalizedValue = normalizedValue.replace(/\D/g, '');
    }

    if (limitedDigitsFields.has(field)) {
      normalizedValue = normalizedValue.slice(0, 10);
    }

    setFormData((prev: any) => ({
      ...prev,
      [field]: normalizedValue,
    }));

    if (errors[field]) {
      setErrors((prev: any) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    await router.put(route('suppliers.update', supplier.id), formData, {
      onSuccess: () => {
        toast.success(t('Supplier updated successfully'));
        router.visit(route('suppliers.index'));
      },
      onError: (validationErrors) => {
        setErrors(validationErrors);
      },
      onFinish: () => {
        setIsSubmitting(false);
      },
    });
  };

  const handleBack = () => {
    router.visit(route('suppliers.show', supplier.id));
  };

  return (
    <PageTemplate
      title={t('Edit Supplier')}
      description={t('Edit supplier information')}
      url="/suppliers/edit"
      noPadding
      actions={[
        {
          label: t('Back'),
          icon: <ArrowLeft className="w-4 h-4" />,
          onClick: handleBack,
          variant: 'outline' as const,
        },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('Supplier Information')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company_name">{t('Company Name')} <span className="text-red-500">*</span></Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder={t('Enter company name')}
                  className={errors.company_name ? 'border-red-500' : ''}
                />
                {errors.company_name && <p className="text-sm text-red-500">{errors.company_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tel_no">{t('Telephone')} <span className="text-red-500">*</span></Label>
                <Input
                  id="tel_no"
                  value={formData.tel_no}
                  onChange={(e) => handleInputChange('tel_no', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder={t('Enter telephone number')}
                  className={errors.tel_no ? 'border-red-500' : ''}
                />
                {errors.tel_no && <p className="text-sm text-red-500">{errors.tel_no}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mail">{t('Email')} </Label>
                <Input
                  id="mail"
                  type="email"
                  value={formData.mail}
                  onChange={(e) => handleInputChange('mail', e.target.value)}
                  placeholder={t('Enter email address')}
                  className={errors.mail ? 'border-red-500' : ''}
                />
                {errors.mail && <p className="text-sm text-red-500">{errors.mail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t('Website')}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder={t('https://example.com')}
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_name">{t('Contact Person')} </Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={(e) => handleInputChange('contact_person_name', e.target.value)}
                  placeholder={t('Enter contact person name')}
                  className={errors.contact_person_name ? 'border-red-500' : ''}
                />
                {errors.contact_person_name && <p className="text-sm text-red-500">{errors.contact_person_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_no">{t('Contact Number')} </Label>
                <Input
                  id="contact_no"
                  value={formData.contact_no}
                  onChange={(e) => handleInputChange('contact_no', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder={t('Enter contact number')}
                  className={errors.contact_no ? 'border-red-500' : ''}
                />
                {errors.contact_no && <p className="text-sm text-red-500">{errors.contact_no}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat_registered">{t('VAT Registered')}   </Label>
                <Select
                  value={formData.vat_registered}
                  onValueChange={(value) => handleInputChange('vat_registered', value)}
                >
                  <SelectTrigger className={errors.vat_registered ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('Select VAT status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">{t('Registered')}</SelectItem>
                    <SelectItem value="not_registered">{t('Not Registered')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vat_registered && <p className="text-sm text-red-500">{errors.vat_registered}</p>}
              </div>

              {formData.vat_registered === 'registered' && (
                <div className="space-y-2">
                  <Label htmlFor="vat_no">{t('VAT Number')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="vat_no"
                    value={formData.vat_no}
                    onChange={(e) => handleInputChange('vat_no', e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={t('Enter VAT number')}
                    className={errors.vat_no ? 'border-red-500' : ''}
                  />
                  {errors.vat_no && <p className="text-sm text-red-500">{errors.vat_no}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('Address')}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('Enter supplier address')}
                rows={3}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
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
    </PageTemplate>
  );
}
