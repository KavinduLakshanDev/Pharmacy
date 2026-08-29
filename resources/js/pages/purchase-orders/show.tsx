import { PageTemplate } from '@/components/page-template';
import { usePage, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Package, Building, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';

export default function PurchaseOrderShow() {
  const { t } = useTranslation();
  const { purchaseOrder } = usePage().props as any;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Purchase Orders'), href: route('purchase-orders.index') },
    { title: purchaseOrder.order_number }
  ];

  const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

  const formatDate = (dateString: string) => {
    if (!dateString) return t('-');
    return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
  };

  return (
    <PageTemplate
      title={purchaseOrder.order_number}
      description=""
      url={route('purchase-orders.show', purchaseOrder.id)}
      breadcrumbs={breadcrumbs}
      actions={[
        {
          label: t('Back to Purchase Orders'),
          icon: <ArrowLeft className="h-4 w-4 mr-2" />,
          variant: 'outline',
          onClick: () => window.history.back()
        }
      ]}
    >
      <div className="mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-bold">{purchaseOrder.name}</h1>
              <p className="text-base text-gray-600 mt-2 leading-relaxed max-w-3xl">{purchaseOrder.description || t('No description provided')}</p>
            </div>
            <div className="text-right ml-6">
              <p className="text-sm font-medium text-gray-700 mt-2 font-mono">{purchaseOrder.order_number}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Products')}</p>
                  <h3 className="mt-2 text-2xl font-bold text-blue-600 leading-none">{purchaseOrder.products?.length || 0}</h3>
                </div>
                <div className="rounded-full bg-blue-100 p-4">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Order Date')}</p>
                  <h3 className="mt-2 text-lg font-bold text-purple-600 leading-tight">{window.appSettings?.formatDateTime(purchaseOrder.order_date, false) || new Date(purchaseOrder.order_date).toLocaleDateString()}</h3>
                </div>
                <div className="rounded-full bg-orange-100 p-4">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Expected Delivery')}</p>
                  <h3 className="mt-2 text-lg font-bold text-purple-600 leading-tight">{window.appSettings?.formatDateTime(purchaseOrder.expected_delivery_date, false) || new Date(purchaseOrder.expected_delivery_date).toLocaleDateString()}</h3>
                </div>
                <div className="rounded-full bg-purple-100 p-4">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Order Information */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg font-semibold">{t('Purchase Order Information')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('Order Number')}</label>
                  <p className="text-sm mt-1">{purchaseOrder.order_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('Supplier')}</label>
                  <p className="text-sm mt-1">{purchaseOrder.supplier?.company_name || t('-')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('Created By')}</label>
                  <p className="text-sm mt-1">{purchaseOrder.creator?.name || t('-')}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('Created At')}</label>
                  <p className="text-sm mt-1">{formatDate(purchaseOrder.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('Updated At')}</label>
                  <p className="text-sm mt-1">{formatDate(purchaseOrder.updated_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Data */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center text-lg font-semibold">
              <Building className="h-5 w-5 mr-3 text-muted-foreground" />
              {t('Related Data')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {purchaseOrder.supplier && (
                <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Supplier')}</p>
                  <Link 
                    href={route('suppliers.show', purchaseOrder.supplier.id)} 
                    className="text-base font-medium text-indigo-700 hover:text-indigo-900 hover:underline transition-colors"
                  >
                    {purchaseOrder.supplier.company_name}
                  </Link>
                </div>
              )}

              {purchaseOrder.shipping_provider_type && (
                <div className="p-6 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Shipping Provider')}</p>
                  <Link 
                    href={route('shipping-provider-types.show', purchaseOrder.shipping_provider_type.id)} 
                    className="text-base font-medium text-orange-700 hover:text-orange-900 hover:underline transition-colors"
                  >
                    {purchaseOrder.shipping_provider_type.name}
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center text-lg font-semibold">
              <Package className="h-5 w-5 mr-3 text-muted-foreground" />
              {t('Products')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {purchaseOrder.products && purchaseOrder.products.length > 0 ? (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="text-base font-bold text-gray-900 py-4 px-6 w-1/3">{t('Product')}</TableHead>
                      <TableHead className="text-right text-base font-bold text-gray-900 py-4 px-4">{t('Quantity')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.products.map((product: any, index: number) => {
                      return (
                        <TableRow key={index} className="border-b hover:bg-gray-50">
                          <TableCell className="font-semibold text-base text-gray-900 py-4 px-6">{product.name}</TableCell>
                          <TableCell className="text-right text-base font-medium py-4 px-4">{product.pivot.quantity}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Package className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                <p className="text-lg font-medium">{t('No products added to this purchase order')}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </PageTemplate>
  );
}