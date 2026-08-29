import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function WastageShow() {
  const { t } = useTranslation();
  const { wastage } = usePage().props as any;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Wastages'), href: route('inventory.wastages.index') },
    { title: wastage.wastage_no },
  ];

  return (
    <PageTemplate
      title={t('Wastage')}
      description={t('View wastage details')}
      breadcrumbs={breadcrumbs}
      url={`/inventory/wastages/${wastage.id}`}
      actions={[
        {
          label: t('Back'),
          variant: 'outline',
          onClick: () => router.visit(route('inventory.wastages.index')),
        },
      ]}
      noPadding
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Wastage Information')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Wastage No')}</p>
              <p className="text-base font-semibold">{wastage.wastage_no}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Branch')}</p>
              <p className="text-base font-semibold">{wastage.branch?.name ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Date')}</p>
              <p className="text-base font-semibold">{wastage.wastage_date ? new Date(wastage.wastage_date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Total Amount')}</p>
              <p className="text-base font-semibold">{window.appSettings?.formatCurrency?.(Number(wastage.total_amount ?? 0)) ?? Number(wastage.total_amount ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Created By')}</p>
              <p className="text-base">{wastage.creator?.name ?? '-'}</p>
            </div>
            {wastage.notes && (
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-gray-500">{t('Notes')}</p>
                <p className="text-base">{wastage.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Product')}</TableHead>
                  <TableHead>{t('SKU')}</TableHead>
                  <TableHead>{t('Batch')}</TableHead>
                  <TableHead>{t('Quantity')}</TableHead>
                  <TableHead>{t('Unit Price')}</TableHead>
                  <TableHead>{t('Line Total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wastage.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name ?? '-'}</TableCell>
                    <TableCell>{item.product?.sku ?? '-'}</TableCell>
                    <TableCell>{item.batch_no ?? '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{window.appSettings?.formatCurrency?.(Number(item.unit_price ?? 0)) ?? Number(item.unit_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{window.appSettings?.formatCurrency?.(Number(item.total_price ?? 0)) ?? Number(item.total_price ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4">
              <p className="font-semibold text-sm">
                {t('Total')}: {window.appSettings?.formatCurrency?.(Number(wastage.total_amount ?? 0)) ?? Number(wastage.total_amount ?? 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}
