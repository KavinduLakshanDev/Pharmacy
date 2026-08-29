import { PageTemplate } from '@/components/page-template';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, ArrowDownCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

export default function ReorderLevelReport() {
  const { t } = useTranslation();
  const { products = [] } = usePage().props as any;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Reports'), href: '#' },
    { title: t('Reorder Level Report') }
  ];

  const summary = useMemo(() => {
    const totalLowStock = products.length;
    const outOfStock = products.filter((p: any) => p.stock_quantity <= 0).length;
    const nearReorder = products.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level).length;

    return {
      totalLowStock,
      outOfStock,
      nearReorder
    };
  }, [products]);

  return (
    <PageTemplate title={t("Reorder Level Report")} url={route('reports.reorder-level')} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-red-500 shadow-sm transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Total Low Stock Items')}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{summary.totalLowStock}</h3>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Out of Stock')}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{summary.outOfStock}</h3>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <Package className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Below Reorder Level')}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{summary.nearReorder}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <ArrowDownCircle className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">{t('Low Stock Inventory Details')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{t('Comprehensive list of products requiring immediate attention')}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider shadow-sm animate-pulse">
                <Info className="h-3 w-3" />
                {t('Live Inventory Sync')}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="pl-6 font-bold py-4">{t('Product Name')}</TableHead>
                    <TableHead className="font-bold py-4">{t('SKU')}</TableHead>
                    <TableHead className="font-bold py-4">{t('Category')}</TableHead>
                    <TableHead className="font-bold py-4">{t('Brand')}</TableHead>
                    <TableHead className="text-right font-bold py-4">{t('Current Stock')}</TableHead>
                    <TableHead className="text-right font-bold py-4">{t('Reorder Level')}</TableHead>
                    <TableHead className="text-center font-bold py-4 pr-6">{t('Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                           <Package className="h-12 w-12 text-gray-100 mb-2" />
                           <p className="text-lg font-medium">{t('All products are above reorder levels')}</p>
                           <p className="text-sm">{t('There are no products currently triggering a reorder alert')}.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product: any) => (
                      <TableRow key={product.id} className="group hover:bg-blue-50/30 transition-all duration-200">
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{product.name}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{t('ID')}: {product.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">{product.sku}</code>
                        </TableCell>
                        <TableCell className="py-4">
                          {product.category ? (
                            <Badge variant="outline" className="bg-gray-50 font-medium text-gray-600 border-gray-200 shadow-sm">
                              {product.category}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                         <TableCell className="py-4 text-sm text-gray-600 italic">
                          {product.brand ?? '-'}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex flex-col items-end">
                            <span className={`text-lg font-black leading-none ${product.stock_quantity <= 0 ? 'text-red-600' : 'text-orange-500'}`}>
                              {product.stock_quantity}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{product.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4 font-bold text-gray-700 bg-gray-50/30">
                          {product.reorder_level}
                        </TableCell>
                        <TableCell className="text-center py-4 pr-6">
                           <div className="flex justify-center">
                              <Badge className={`
                                px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm
                                ${product.stock_quantity <= 0 
                                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                                  : "bg-orange-400 hover:bg-orange-500 text-white"}
                              `}>
                                {product.stock_quantity <= 0 ? t('Out of Stock') : t('Low Stock')}
                              </Badge>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl transform transition-transform hover:scale-[1.01] duration-300">
           <div className="flex items-start gap-5">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                 <Package className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                 <h4 className="text-xl font-bold mb-1 tracking-tight">{t('Inventory Optimization Tip')}</h4>
                 <p className="text-blue-50 text-sm leading-relaxed opacity-90 max-w-2xl">
                    {t('Keeping your stock levels close to the reorder level helps optimize cash flow. If items are frequently reaching this level too fast, consider updating the reorder value in product settings or reviewing your supplier delivery schedules.')}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </PageTemplate>
  );
}
