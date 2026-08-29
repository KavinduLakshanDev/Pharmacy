import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Branch {
  id: number;
  name: string;
}

interface StockRow {
  product_id: number;
  batch_no: string;
  branch_id?: number | null;
  product_name: string;
  product_sku: string;
  expiry_date: string | null;
  stock_in_hand: number | string;
  unit_cost_price: number | string | null;
  supplier_return_count: number | string;
  latest_return_date?: string | null;
}

interface StockPaginator {
  data: StockRow[];
  links: Array<{ url: string | null; label: string; active: boolean }>;
  from: number;
  to: number;
  total: number;
}

export default function DrugDestroysPage() {
  const { t } = useTranslation();

  const { stockRows, branches = [], filters = {} } = usePage<{
    stockRows?: StockPaginator;
    branches?: Branch[];
    filters?: Record<string, string>;
  }>().props;

  const [destroyDate] = useState(() => new Date().toISOString().split('T')[0]);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Inventory'), href: route('inventory.dashboard') },
    { title: t('Drug Destroys') },
  ];

  const handleBranchFilter = (value: string) => {
    router.get(route('inventory.drug-destroys.index'), { ...filters, branch_id: value === 'all' ? undefined : value }, { preserveState: true, replace: true });
  };

  const formatQuantity = (value: number | string): number => Number(value ?? 0);

  const navigateToSupplierReturn = (row: StockRow): void => {
    const query = new URLSearchParams();

    const branchId = row.branch_id ?? (filters.branch_id && filters.branch_id !== 'all' ? Number(filters.branch_id) : null);

    if (branchId !== null) {
      query.set('branch_id', String(branchId));
    }

    query.set('product_id', String(row.product_id));
    query.set('batch_no', row.batch_no || '');

    router.visit(`${route('inventory.supplier-returns.create')}?${query.toString()}`);
  };

  const destroyStock = (row: StockRow): void => {
    const quantity = formatQuantity(row.stock_in_hand);
    const unitPrice = Number(row.unit_cost_price ?? 0);

    if (quantity <= 0) {
      return;
    }

    if (!window.confirm(t('Are you sure you want to destroy this stock? This action cannot be undone.'))) {
      return;
    }

    router.post(route('inventory.drug-destroys.store'), {
      ...(row.branch_id ? { branch_id: row.branch_id } : (filters.branch_id && filters.branch_id !== 'all' ? { branch_id: filters.branch_id } : {})),
      destroy_date: destroyDate,
      notes: 'Expired stock destruction',
      items: [
        {
          product_id: row.product_id,
          batch_no: row.batch_no || null,
          expiry_date: row.expiry_date || null,
          quantity,
          unit_price: unitPrice,
        },
      ],
    });
  };

  return (
    <PageTemplate
      title={t('Drug Destroys')}
      description={t('Review expiring stock and destroy items that have not been returned to the supplier.')}
      url="/inventory/drug-destroys"
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Expiring drugs (next 3 months)')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{t('Branch')}</span>
                <Select value={filters.branch_id ?? 'all'} onValueChange={handleBranchFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t('All Branches')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All Branches')}</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-slate-500">{t('Destroy stock only when no supplier return exists for the selected batch.')}</p>
            </div>
            {stockRows?.data?.length ? (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">{t('Product')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('Batch')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('Expiry Date')}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t('Quantity')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('Supplier Return')}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t('Last Return Date')}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stockRows.data.map((row) => (
                      <tr key={`${row.product_id}-${row.batch_no}`}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{row.product_name}</td>
                        <td className="whitespace-nowrap px-4 py-3">{row.batch_no || t('No batch')}</td>
                        <td className="whitespace-nowrap px-4 py-3">{row.expiry_date ?? t('Unknown')}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{formatQuantity(row.stock_in_hand).toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatQuantity(row.supplier_return_count) > 0 ? t('Returned') : t('Not returned')}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{row.latest_return_date ?? '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right space-x-2">
                          {formatQuantity(row.supplier_return_count) === 0 ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigateToSupplierReturn(row)}
                              >
                                {t('Create Return')}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => destroyStock(row)}>
                                {t('Destroy')}
                              </Button>
                            </>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {t('Already returned')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t('No expiring drugs found for the next three months.')}</p>
            )}
            {stockRows && stockRows.total > 0 ? (
              <div className="mt-4">
                <Pagination
                  from={stockRows.from}
                  to={stockRows.to}
                  total={stockRows.total}
                  links={stockRows.links}
                  entityName={t('expiring drugs').toLowerCase()}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}
