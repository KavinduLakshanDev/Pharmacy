import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hasPermission } from '@/utils/authorization';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Edit, FileText, Hash, Truck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DeliveryRouteShow() {
    const { t } = useTranslation();
    const { deliveryRoute, auth } = usePage().props as any;
    const permissions = auth?.permissions || [];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Delivery Routes'), href: route('delivery-routes.index') },
        { title: deliveryRoute.routename },
    ];

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const pageActions = [
        {
            label: t('Back to Delivery Routes'),
            icon: <ArrowLeft className="mr-2 h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => router.visit(route('delivery-routes.index')),
        },
        ...(hasPermission(permissions, 'edit-delivery-routes')
            ? [
                  {
                      label: t('Edit'),
                      icon: <Edit className="mr-2 h-4 w-4" />,
                      onClick: () => router.visit(route('delivery-routes.edit', deliveryRoute.id)),
                  },
              ]
            : []),
    ];

    return (
        <PageTemplate
            title={deliveryRoute.routename}
            description={t('View delivery route details')}
            url={route('delivery-routes.show', deliveryRoute.id)}
            breadcrumbs={breadcrumbs}
            actions={pageActions}
            noPadding
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Truck className="mr-2 h-5 w-5" />
                            {deliveryRoute.routename}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Hash className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground text-sm">{t('Route Code')}:</span>
                                    <span className="font-mono font-medium">{deliveryRoute.routecode}</span>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <FileText className="text-muted-foreground mt-0.5 h-4 w-4" />
                                    <div className="flex-1">
                                        <span className="text-muted-foreground text-sm">{t('Description')}:</span>
                                        <p className="mt-1 text-sm">{deliveryRoute.description || t('No description provided')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground text-sm">{t('Created')}:</span>
                                    <span className="text-sm">{formatDate(deliveryRoute.created_at)}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Calendar className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground text-sm">{t('Updated')}:</span>
                                    <span className="text-sm">{formatDate(deliveryRoute.updated_at)}</span>
                                </div>

                                {deliveryRoute.created_by && (
                                    <div className="flex items-center space-x-2">
                                        <User className="text-muted-foreground h-4 w-4" />
                                        <span className="text-muted-foreground text-sm">{t('Created By')}:</span>
                                        <span className="text-sm">{deliveryRoute.creator?.name || t('Unknown')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
                <div className="space-y-6">
                {/* Additional Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Additional Information')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground text-sm">
                            {t('This delivery route can be used to organize and track deliveries within your system.')}
                        </div>
                    </CardContent>
                </Card>
            </div>
            </div>
        </PageTemplate>
    );
}
