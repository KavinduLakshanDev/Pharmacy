import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { toast } from '@/components/custom-toast';

export default function DeliveryRouteCreate() {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;

  const [formData, setFormData] = useState({
    routename: '',
    routecode: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Delivery Routes'), href: route('delivery-routes.index') },
    { title: t('Create Delivery Route') }
  ];

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await router.post(route('delivery-routes.store'), formData, {
        onSuccess: () => {
          toast.success(t('Delivery route created successfully'));
          router.visit(route('delivery-routes.index'));
        },
        onError: (errors) => {
          toast.error(t('Failed to create delivery route'));
        },
        onFinish: () => setIsSubmitting(false),
      });
    } catch (error) {
      setIsSubmitting(false);
      toast.error(t('An unexpected error occurred'));
    }
  };

  const pageActions = [
    {
      label: t('Back to Delivery Routes'),
      icon: <ArrowLeft className="h-4 w-4 mr-2" />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('delivery-routes.index'))
    },
  ];

  return (
      <PageTemplate
          title={t('Create Delivery Route')}
          description={t('Create a new delivery route for organizing deliveries')}
          url={route('delivery-routes.create')}
          breadcrumbs={breadcrumbs}
          actions={pageActions}
          noPadding
      >
          <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center">
                          <Truck className="mr-2 h-5 w-5" />
                          {t('Delivery Route Information')}
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                              <div className="space-y-2">
                                  <label htmlFor="routename" className="text-sm font-medium">
                                      {t('Route Name')} <span className="text-red-500">*</span>
                                  </label>
                                  <Input
                                      id="routename"
                                      value={formData.routename}
                                      onChange={(e) => handleInputChange('routename', e.target.value)}
                                      placeholder={t('Enter route name')}
                                      required
                                  />
                              </div>

                              <div className="space-y-2">
                                  <label htmlFor="routecode" className="text-sm font-medium">
                                      {t('Route Code')} <span className="text-red-500">*</span>
                                  </label>
                                  <Input
                                      id="routecode"
                                      value={formData.routecode}
                                      onChange={(e) => handleInputChange('routecode', e.target.value)}
                                      placeholder={t('Enter route code')}
                                      required
                                  />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label htmlFor="description" className="text-sm font-medium">
                                  {t('Description')}
                              </label>
                              <Textarea
                                  id="description"
                                  value={formData.description}
                                  onChange={(e) => handleInputChange('description', e.target.value)}
                                  placeholder={t('Enter route description')}
                                  rows={3}
                              />
                          </div>

                          <div className="flex justify-end space-x-4">
                              <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => router.visit(route('delivery-routes.index'))}
                                  disabled={isSubmitting}
                              >
                                  {t('Cancel')}
                              </Button>
                              <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting ? t('Creating...') : t('Create Delivery Route')}
                              </Button>
                          </div>
                      </form>
                  </CardContent>
              </Card>
          </div>
      </PageTemplate>
  );
}
