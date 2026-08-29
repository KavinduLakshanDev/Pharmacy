import { PageTemplate } from '@/components/page-template';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Zap, 
  TrendingDown, 
  AlertCircle, 
  Package, 
  LayoutGrid, 
  BarChart3, 
  Table as TableIcon 
} from 'lucide-react';
import { ReportFilters } from '@/components/reports/report-filters';
import { SummaryCards } from '@/components/reports/summary-cards';
import { ChartCard } from '@/components/reports/chart-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function FastSlowMovingReport() {
  const { t } = useTranslation();
  const { filters, summary, productSales, movingDistribution } = usePage().props as any;
  const [viewType, setViewType] = useState<'both' | 'graphs' | 'table'>('both');

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Reports'), href: '#' },
    { title: t('Fast & Slow Moving Items') }
  ];

  const summaryCards = [
    {
      title: t('Total Items'),
      value: summary.total_items.toLocaleString(),
      icon: <Package className="h-6 w-6 text-blue-600" />,
      iconColor: 'bg-blue-100'
    },
    {
      title: t('Fast Moving'),
      value: summary.fast_moving.toLocaleString(),
      icon: <Zap className="h-6 w-6 text-green-600" />,
      iconColor: 'bg-green-100'
    },
    {
      title: t('Slow Moving'),
      value: summary.slow_moving.toLocaleString(),
      icon: <TrendingDown className="h-6 w-6 text-amber-600" />,
      iconColor: 'bg-amber-100'
    },
    {
      title: t('Non-Moving'),
      value: summary.non_moving.toLocaleString(),
      icon: <AlertCircle className="h-6 w-6 text-red-600" />,
      iconColor: 'bg-red-100'
    }
  ];

  const topMoving = [...productSales].sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fast':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">{t('Fast')}</Badge>;
      case 'Slow':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">{t('Slow')}</Badge>;
      case 'Non-Moving':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">{t('Non-Moving')}</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">{t('Normal')}</Badge>;
    }
  };

  return (
    <PageTemplate 
      title={t("Fast & Slow Moving Items")} 
      url={route('reports.fast-slow-moving')} 
      breadcrumbs={breadcrumbs} 
      noPadding
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b gap-4">
        <ReportFilters filters={filters} hideCard />
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button 
            variant={viewType === 'both' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewType('both')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            {t('Both')}
          </Button>
          <Button 
            variant={viewType === 'graphs' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewType('graphs')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {t('Graphs')}
          </Button>
          <Button 
            variant={viewType === 'table' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewType('table')}
            className="flex items-center gap-2"
          >
            <TableIcon className="h-4 w-4" />
            {t('Table')}
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        <SummaryCards cards={summaryCards} />

        {(viewType === 'both' || viewType === 'graphs') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard title={t('Item Distribution by Movement')}>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={movingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {movingDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t('Top 10 Moving Items (Quantity)')}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topMoving} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [Number(value).toLocaleString(), t('Quantity')]} />
                  <Bar dataKey="total_quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {(viewType === 'both' || viewType === 'table') && (
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-black/5">
            <div className="bg-white px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('Movement Details')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Product')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('SKU')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Quantity Sold')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Revenue')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productSales.length > 0 ? (
                    productSales.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                          {item.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-mono">
                          {item.total_quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold font-mono">
                          {window.appSettings?.formatCurrency(item.total_revenue) || `$${item.total_revenue.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(item.moving_status)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                        {t('No data available for the selected period')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}
