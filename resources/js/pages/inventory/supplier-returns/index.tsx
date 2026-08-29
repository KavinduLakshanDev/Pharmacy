import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Branch {
  id: number;
  name: string;
}

interface SupplierReturnRow {
  id: number;
  return_number: string;
  return_date: string;
  status: string;
  total_amount: number;
  items_count: number;
  branch?: { id: number; name: string } | null;
  supplier?: {
    company_name: string;
    contact_person_name: string | null;
  } | null;
  grn?: {
    invoice_no: string | null;
    grn_no: string;
  } | null;
}

interface SupplierReturnPaginator {
  data: SupplierReturnRow[];
  links: Array<{ url: string | null; label: string; active: boolean }>;
  from: number;
  to: number;
  total: number;
}

export default function SupplierReturnsPage() {
  const { supplierReturns, branches = [], filters = {} } = usePage<{
    supplierReturns?: SupplierReturnPaginator;
    branches: Branch[];
    filters: Record<string, string>;
  }>().props;
  const { t: translate } = useTranslation();
  const pageActions = [
    {
      label: translate('Add Supplier Return'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => router.visit(route('inventory.supplier-returns.create')),
    },
  ];

  const formatDate = (value: string): string => value.split('T')[0] ?? value;

  const handleBranchFilter = (value: string) => {
    router.get(route('inventory.supplier-returns.index'), { ...filters, branch_id: value === 'all' ? undefined : value }, { preserveState: true, replace: true });
  };

  const breadcrumbs = [
    { title: translate('Dashboard'), href: route('dashboard') },
    { title: translate('Inventory'), href: route('inventory.dashboard') },
    { title: translate('Supplier Returns') },
  ];

  return (
    <PageTemplate
      title={translate('Supplier Returns')}
      description={translate('Review supplier returns and create new ones.')}
      url="/inventory/supplier-returns"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{translate('Supplier Return History')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <Select value={filters.branch_id ?? 'all'} onValueChange={handleBranchFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={translate('All Branches')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All Branches')}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {supplierReturns?.data?.length ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">{translate('Return No')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{translate('Branch')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{translate('Supplier')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{translate('Supplier Invoice')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{translate('Return Date')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{translate('Items')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{translate('Total Amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {supplierReturns.data.map((supplierReturn) => (
                        <tr key={supplierReturn.id}>
                          <td className="whitespace-nowrap px-4 py-3 font-medium">{supplierReturn.return_number}</td>
                          <td className="whitespace-nowrap px-4 py-3">{supplierReturn.branch?.name ?? '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="font-medium">{supplierReturn.supplier?.company_name ?? '-'}</div>
                            {supplierReturn.supplier?.contact_person_name && (
                              <div className="text-xs text-gray-500">{supplierReturn.supplier.contact_person_name}</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{supplierReturn.grn?.invoice_no ?? supplierReturn.grn?.grn_no ?? '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">{formatDate(supplierReturn.return_date)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">{supplierReturn.items_count}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">{Number(supplierReturn.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  from={supplierReturns.from}
                  to={supplierReturns.to}
                  total={supplierReturns.total}
                  links={supplierReturns.links}
                  entityName={translate('Supplier Returns').toLowerCase()}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">{translate('No supplier returns found')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}
