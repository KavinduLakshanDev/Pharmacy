import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Truck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DeliveryRouteEdit() {
    const { t } = useTranslation();
    const { deliveryRoute, auth } = usePage().props as any;

    const [formData, setFormData] = useState({
        routename: deliveryRoute.routename || '',
        routecode: deliveryRoute.routecode || '',
        description: deliveryRoute.description || '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Delivery Routes'), href: route('delivery-routes.index') },
        { title: deliveryRoute.routename, href: route('delivery-routes.show', deliveryRoute.id) },
        { title: t('Edit') },
    ];

    const handleInputChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await router.put(route('delivery-routes.update', deliveryRoute.id), formData, {
                onSuccess: () => {
                    toast.success(t('Delivery route updated successfully'));
                    router.visit(route('delivery-routes.index'));
                },
                onError: (errors) => {
                    toast.error(t('Failed to update delivery route'));
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
            icon: <ArrowLeft className="mr-2 h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => router.visit(route('delivery-routes.index')),
        },
    ];

    return (
        <PageTemplate
            title={t('Edit Delivery Route')}
            description={t('Edit the delivery route information')}
            url={route('delivery-routes.edit', deliveryRoute.id)}
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
                                    {isSubmitting ? t('Updating...') : t('Update Delivery Route')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
