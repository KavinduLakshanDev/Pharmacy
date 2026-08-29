import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Mail, Phone, Globe, MapPin, Building2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function ShowSupplier() {
  const { t } = useTranslation();
  const { supplier } = usePage().props as any;

  const handleEdit = () => {
    router.visit(route('suppliers.edit', supplier.id));
  };

  const handleBack = () => {
    router.visit(route('suppliers.index'));
  };

  return (
    <PageTemplate
      title={t('Supplier Details')}
      description={t('View supplier information')}
      url="/suppliers/show"
      noPadding
      actions={[
        {
          label: t('Back to Suppliers'),
          icon: <ArrowLeft className="w-4 h-4" />,
          onClick: handleBack,
          variant: 'outline' as const,
        },
        {
          label: t('Edit Supplier'),
          icon: <Edit className="w-4 h-4" />,
          onClick: handleEdit,
        },
      ]}
      >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {supplier.company_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant={supplier.vat_registered === 'registered' ? 'default' : 'secondary'}>
                  {supplier.vat_registered === 'registered' ? t('VAT Registered') : t('Not VAT Registered')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{supplier.mail}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{supplier.tel_no}</span>
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{supplier.contact_person_name} ({supplier.contact_no})</span>
                </div>

                {supplier.website && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {supplier.website}
                    </a>
                  </div>
                )}
              </div>

              {supplier.vat_registered === 'registered' && supplier.vat_no && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('VAT Number')}</label>
                  <p className="text-sm">{supplier.vat_no}</p>
                </div>
              )}

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="whitespace-pre-line">{supplier.address}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Created')}</label>
                <p className="text-sm">
                  {new Date(supplier.created_at).toLocaleDateString()} {new Date(supplier.created_at).toLocaleTimeString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Last Updated')}</label>
                <p className="text-sm">
                  {new Date(supplier.updated_at).toLocaleDateString()} {new Date(supplier.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
