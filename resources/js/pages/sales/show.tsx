import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, User, Calendar, CreditCard, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SaleInvoiceModal from '@/pages/sales/components/sale-invoice-modal';
import { useTranslation } from 'react-i18next';

export default function SaleShow() {
  const { t } = useTranslation();
  const { sale } = usePage().props as any;
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Sales'), href: route('sales.index') },
    { title: sale.sale_no },
  ];

  const formatCurrency = (value: number) =>
    window.appSettings?.formatCurrency?.(Number(value || 0)) ?? `$${Number(value || 0).toFixed(2)}`;

  const formatDate = (date: string) => {
    if (!date) return t('-');
    return window.appSettings?.formatDateTime?.(date, false) ?? new Date(date).toLocaleDateString();
  };

  return (
    <PageTemplate
      title={sale.sale_no}
      description={t('View sale details')}
      breadcrumbs={breadcrumbs}
      url={`/sales/${sale.id}`}
      actions={[
        {
          label: t('Print Invoice'),
          icon: <Printer className="h-4 w-4 mr-2" />,
          variant: 'default',
          onClick: () => setIsInvoiceOpen(true),
        },
        {
          label: t('Back to Sales'),
          icon: <ArrowLeft className="h-4 w-4 mr-2" />,
          variant: 'outline',
          onClick: () => router.visit(route('sales.index')),
        },
      ]}
    >
      <div className="mx-auto space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('Sale Information')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Sale Number')}</p>
                  <p className="mt-1 text-xs font-semibold">{sale.sale_no}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Customer')}</p>
                  <p className="mt-1 text-sm font-medium">{sale.customer?.name || t('Walk-in Customer')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Branch')}</p>
                  <p className="mt-1 text-sm">{sale.branch?.name || t('-')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Status')}</p>
                  <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-semibold ${sale.status === 'completed' ? 'bg-green-100 text-green-800' : sale.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {t(sale.status.charAt(0).toUpperCase() + sale.status.slice(1))}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Sale Date')}</p>
                  <p className="mt-1 text-sm">{formatDate(sale.sale_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Payment Method')}</p>
                  <p className="mt-1 text-sm uppercase">{sale.payment_method || t('-')}</p>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Financial Summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('Subtotal')}</span>
                <span className="font-semibold">{formatCurrency(sale.sub_total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('Total Discount')}</span>
                <span className="font-semibold text-green-600">-{formatCurrency(sale.discount_amount)}</span>
              </div>
              {Number(sale.delivery_charge || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('Delivery Charge')}</span>
                  <span className="font-semibold text-blue-600">+{formatCurrency(sale.delivery_charge)}</span>
                </div>
              )}
              {/* <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('Tax')}</span>
                <span className="font-semibold">{formatCurrency(sale.tax_amount)}</span>
              </div> */}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>{t('Grand Total')}</span>
                <span className="text-primary">{formatCurrency(sale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-md font-medium text-blue-600">
                <span>{t('Paid Amount')}</span>
                <span>{formatCurrency(sale.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-md font-medium text-red-600 border-t pt-2">
                <span>{t('Balance Due')}</span>
                <span>{formatCurrency(sale.balance_amount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('Sale Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('#')}</TableHead>
                  <TableHead>{t('Product')}</TableHead>
                  <TableHead>{t('Batch')}</TableHead>
                  <TableHead className="text-center">{t('Expiry')}</TableHead>
                  <TableHead>{t('Quantity')}</TableHead>
                  <TableHead>{t('Unit Price')}</TableHead>
                  <TableHead>{t('Discount')}</TableHead>
                  <TableHead>{t('Total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sale.items || []).map((item: any, index: number) => {
                  const base = Number(item.quantity || 0) * Number(item.unit_price || 0);
                  const discount = Number(item.discount_amount || 0);
                  const total = base - discount;

                  return (
                    <TableRow key={item.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product?.name || t('-')}</p>
                          <p className="text-xs text-gray-500">{item.product?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {item.batch_no || t('N/A')}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-orange-600">
                        {item.expiry_date ? item.expiry_date.split('T')[0] : '-'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(Number(item.unit_price || 0))}</TableCell>
                      <TableCell>
                         {item.discount_type ? (
                             <div className="text-xs">
                                 <p className="text-green-600 font-medium">{formatCurrency(discount)}</p>
                                 <p className="text-gray-400">({item.discount_type === 'percentage' ? `${item.discount_value}%` : t('Fixed')})</p>
                             </div>
                         ) : t('-')}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <SaleInvoiceModal open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen} sale={sale} />
    </PageTemplate>
  );
}
