import { PageTemplate } from '@/components/page-template';
import { Card } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast-notification';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InventoryAuditPage() {
    const { t } = useTranslation();

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Audit') },
    ];

    const pageActions = [];
    pageActions.push({
        label: t('Placeholder.Print'),
        icon: <Printer className="mr-2 h-4 w-4" />,
        variant: 'ghost',
        onClick: () => showToast(t('Print functionality is not implemented yet.'), 'info'),
    });

    return (
        <PageTemplate
            title={t('Inventory Audit')}
            description={t('Audit stock movements across inventory transactions.')}
            url="/inventory/audit"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Card className="p-6">
                <p className="text-muted-foreground text-sm">{t('Inventory audit views and reports will be added here.')}</p>
            </Card>
        </PageTemplate>
    );
}
