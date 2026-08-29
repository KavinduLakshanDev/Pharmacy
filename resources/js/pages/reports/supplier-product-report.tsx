import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Package, TrendingUp, AlertTriangle, DollarSign, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SearchableSelect from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

export default function SupplierProductReport() {
  const { t } = useTranslation();
  const { suppliers = [], products = [], filters = {} } = usePage().props as any;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Reports'), href: '#' },
    { title: t('Supplier Product Report') }
  ];

  const handleSupplierChange = (value: string) => {
    router.get(route('reports.supplier-product'), { supplier_id: value }, { preserveState: true });
  };

  const summary = useMemo(() => {
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum: number, p: any) => sum + (p.stock * p.cost_price), 0);
    const totalProfit = products.reduce((sum: number, p: any) => sum + p.profit, 0);
    const expiringSoon = products.filter((p: any) => p.is_expiring_soon).length;

    return {
      totalProducts,
      totalStockValue,
      totalProfit,
      expiringSoon
    };
  }, [products]);

  const getMovingBadge = (status: string) => {
    switch (status) {
      case 'Fast':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{t('Fast Moving')}</Badge>;
      case 'Slow':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">{t('Slow Moving')}</Badge>;
      default:
        return <Badge variant="outline">{t('Normal')}</Badge>;
    }
  };

  return (
    <PageTemplate title={t("Supplier Product Report")} url={route('reports.supplier-product')} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">{t('Filter by Supplier')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <SearchableSelect
                value={filters.supplier_id?.toString() ?? ''}
                onValueChange={handleSupplierChange}
                options={suppliers.map((s: any) => ({
                  value: String(s.id),
                  label: s.company_name
                }))}
                placeholder={t('Select a supplier to view products')}
              />
            </div>
          </CardContent>
        </Card>

        {filters.supplier_id && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Total Products')}</p>
                      <h3 className="text-2xl font-bold">{summary.totalProducts}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Stock Value (Cost)')}</p>
                      <h3 className="text-2xl font-bold">
                        {window.appSettings?.formatCurrency?.(summary.totalStockValue) ?? summary.totalStockValue.toFixed(2)}
                      </h3>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Potential Profit')}</p>
                      <h3 className="text-2xl font-bold text-green-600">
                        {window.appSettings?.formatCurrency?.(summary.totalProfit) ?? summary.totalProfit.toFixed(2)}
                      </h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Expiring Soon (3m)')}</p>
                      <h3 className="text-2xl font-bold text-red-600">{summary.expiringSoon}</h3>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('Supplier Product Details')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Product Name')}</TableHead>
                        <TableHead>{t('SKU')}</TableHead>
                        <TableHead className="text-right">{t('Current Stock')}</TableHead>
                        <TableHead>{t('Moving Status')}</TableHead>
                        <TableHead className="text-right">{t('Cost Price')}</TableHead>
                        <TableHead className="text-right">{t('Sale Price')}</TableHead>
                        <TableHead className="text-right">{t('Total Profit')}</TableHead>
                        <TableHead>{t('Expiry Date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                            {t('No products found for this supplier')}.
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product: any) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-sm text-gray-500">{product.sku}</TableCell>
                            <TableCell className="text-right">
                              {product.stock} <span className="text-xs text-gray-400">{product.unit}</span>
                            </TableCell>
                            <TableCell>{getMovingBadge(product.moving_status)}</TableCell>
                            <TableCell className="text-right">
                              {window.appSettings?.formatCurrency?.(product.cost_price) ?? product.cost_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {window.appSettings?.formatCurrency?.(product.sale_price) ?? product.sale_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {window.appSettings?.formatCurrency?.(product.profit) ?? product.profit.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className={product.is_expiring_soon ? "text-red-600 font-bold flex items-center gap-1" : ""}>
                                {product.is_expiring_soon && <AlertTriangle className="h-3 w-3" />}
                                {product.expiry_date ?? t('N/A')}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!filters.supplier_id && (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed">
            <Search className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{t('Please select a supplier to generate the report')}</p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
