import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { formatWeight } from '@/lib/weight';

export default function GrnShow() {
  const { t } = useTranslation();
  const { grn } = usePage().props as any;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('GRN'), href: route('grns.index') },
    { title: grn.grn_no },
  ];

  const formatCurrency = (value: number) =>
    window.appSettings?.formatCurrency?.(Number(value || 0)) ?? `$${Number(value || 0).toFixed(2)}`;

  const calculateTotals = () => {
    let subTotal = 0;
    let totalDiscount = 0;

    (grn.items || []).forEach((item: any) => {
      const totalPrice = Number(item.total_price) || 0;
      const discount = Number(item.discount_amount) || 0;
      subTotal += totalPrice;
      totalDiscount += discount;
    });

    return {
      subTotal,
      totalDiscount,
      grandTotal: subTotal - totalDiscount,
    };
  };

  const { subTotal, totalDiscount, grandTotal } = calculateTotals();

  const formatDate = (date: string) => {
    if (!date) return t('-');
    return window.appSettings?.formatDateTime?.(date, false) ?? new Date(date).toLocaleDateString();
  };

  const calculateExpiryDate = (item: any) => {
    // If user has manually provided an expiry date on the GRN item, show it.
    if (item.expiry_date) {
      return formatDate(item.expiry_date);
    }

    // Otherwise auto-calculate using the product's expire period (in days) + GRN date.
    const days = Number(item.product?.expire_date ?? item.product?.expiry_days ?? 0);
    if (!days || !grn.grn_date) {
      return t('-');
    }

    const grnDate = new Date(grn.grn_date);
    if (Number.isNaN(grnDate.getTime())) {
      return t('-');
    }

    const expiry = new Date(grnDate);
    expiry.setDate(expiry.getDate() + days);

    return formatDate(expiry.toISOString());
  };

  return (
    <PageTemplate
      title={grn.grn_no}
      description={t('View GRN details')}
      breadcrumbs={breadcrumbs}
      url={`/grns/${grn.id}`}
      actions={[
        {
          label: t('Back to GRNs'),
          icon: <ArrowLeft className="h-4 w-4 mr-2" />,
          variant: 'outline',
          onClick: () => router.visit(route('grns.index')),
        },
      ]}
    >
      <div className="mx-auto space-y-6 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('GRN Information')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('GRN Number')}</p>
                <p className="mt-1 text-sm font-semibold">{grn.grn_no}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Batch No')}</p>
                <p className="mt-1 text-sm">{grn.batch_no || t('-')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Invoice No')}</p>
                <p className="mt-1 text-sm">{grn.invoice_no || t('-')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Supplier')}</p>
                <p className="mt-1 text-sm">{grn.supplier?.company_name || t('-')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Status')}</p>
                <p className="mt-1 text-sm capitalize">{grn.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Description')}</p>
                <p className="mt-1 text-sm">{grn.description || t('-')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Created At')}</p>
                <p className="mt-1 text-sm">{formatDate(grn.created_at)}</p>
              </div>
            </div>
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
                  <TableHead>{t('#')}</TableHead>
                  <TableHead>{t('Product')}</TableHead>
                  <TableHead>{t('Batch No')}</TableHead>
                  <TableHead>{t('Quantity')}</TableHead>
                  {/* <TableHead>{t('Weight')}</TableHead> */}
                  <TableHead>{t('Expiry Date')}</TableHead>
                  <TableHead>{t('Unit Price')}</TableHead>
                  <TableHead>{t('Unit Sales Price')}</TableHead>
                  <TableHead>{t('Unit Stock (tablet)')}</TableHead>
                  <TableHead>{t('Discount')}</TableHead>
                  <TableHead>{t('Line Total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grn.items || []).map((item: any, index: number) => {
                  const weight = Number(item.product?.unit_weight || 0) * Number(item.quantity || 0);
                  const base = Number(item.quantity || 0) * Number(item.unit_price || 0);
                  const discount = Number(item.discount_amount || 0);
                  const total = base - discount;
                  const packSize = Number(item.pack_size) || 1;
                  const unitSalesPrice = item.sale_price != null ? Number(item.sale_price) / packSize : null;
                  const unitStock = (Number(item.quantity || 0) + Number(item.free_qty || 0)) * packSize;

                  return (
                    <TableRow key={item.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.product?.name || t('-')}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {item.batch_no || t('-')}
                        </span>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      {/* <TableCell>{formatWeight(weight, item.product?.unit?.name)}</TableCell> */}
                      <TableCell>{calculateExpiryDate(item)}</TableCell>
                      <TableCell>{formatCurrency(Number(item.unit_price || 0))}</TableCell>
                      <TableCell>{unitSalesPrice != null ? formatCurrency(unitSalesPrice) : t('-')}</TableCell>
                      <TableCell>{unitStock.toFixed(0)}</TableCell>
                      <TableCell>
                        {item.discount_type ? `${item.discount_type} (${formatCurrency(discount)})` : t('-')}
                      </TableCell>
                      <TableCell>{formatCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-sm text-gray-500">{t('Subtotal')}</p>
                <p className="text-lg font-semibold">{formatCurrency(subTotal)}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-sm text-gray-500">{t('Total Discount')}</p>
                <p className="text-lg font-semibold">-{formatCurrency(totalDiscount)}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-sm text-gray-500">{t('Grand Total')}</p>
                <p className="text-lg font-semibold">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}
