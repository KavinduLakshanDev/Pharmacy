import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Star, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { hasPermission } from '@/utils/authorization';
import { useTranslation } from 'react-i18next';

export default function Show() {
  const { t } = useTranslation();
  const { auth, customer } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const handleEdit = () => {
    router.visit(route('customers.edit', customer.id));
  };

  const handleBack = () => {
    router.visit(route('customers.index'));
  };

  return (
    <PageTemplate 
      title={t('Customer Details')} 
      description={t('View customer information')} 
      url="/customers/show"
      noPadding
      actions={[
        {
          label: t('Back to Customers'),
          icon: <ArrowLeft className="w-4 h-4" />,
          onClick: handleBack,
          variant: 'outline' as const,
        },
        ...(hasPermission(permissions, 'edit-customers') ? [{
          label: t('Edit Customer'),
          icon: <Edit className="w-4 h-4" />,
          onClick: handleEdit,
        }] : [])
      ]}
    >
      <div className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {customer.type === 'privileged_customer' ? (
                    <Star className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  {customer.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {customer.type === 'privileged_customer'
                      ? t('Privileged Customer')
                      : t('Customer')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>

                  {customer.code && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 text-muted-foreground font-mono text-sm">ID:</span>
                      <span className="font-mono">{customer.code}</span>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}

                  {customer.type === 'privileged_customer' && customer.privileged_customer_number && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <span>{t('Privileged Customer Number')}: {customer.privileged_customer_number}</span>
                    </div>
                  )}
                </div>

                {customer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="whitespace-pre-line">{customer.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('Created')}
                  </label>
                  <p className="text-sm">
                    {new Date(customer.created_at).toLocaleDateString()} {new Date(customer.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('Last Updated')}
                  </label>
                  <p className="text-sm">
                    {new Date(customer.updated_at).toLocaleDateString()} {new Date(customer.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}