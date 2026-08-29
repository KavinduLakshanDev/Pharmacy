import { useState } from 'react';
import { PageTemplate, type PageAction } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';

export default function StockTransferIndex() {
  const { t } = useTranslation();
  const { items, statuses = [], branches = [], filters: pageFilters = {} } = usePage().props as any;

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [selectedFromBranch, setSelectedFromBranch] = useState(pageFilters.from_branch_id || 'all');
  const [selectedToBranch, setSelectedToBranch] = useState(pageFilters.to_branch_id || 'all');
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = () => {
    router.get(route('inventory.stock-transfers.index'), {
      page: 1,
      search: searchTerm || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      from_branch_id: selectedFromBranch !== 'all' ? selectedFromBranch : undefined,
      to_branch_id: selectedToBranch !== 'all' ? selectedToBranch : undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedFromBranch('all');
    setSelectedToBranch('all');
    setShowFilters(false);
    router.get(route('inventory.stock-transfers.index'), { page: 1, per_page: pageFilters.per_page }, { preserveState: true, preserveScroll: true });
  };

  const hasActiveFilters = () => Boolean(searchTerm) || selectedStatus !== 'all' || selectedFromBranch !== 'all' || selectedToBranch !== 'all';
  const activeFilterCount = () =>
    Number(Boolean(searchTerm)) + Number(selectedStatus !== 'all') + Number(selectedFromBranch !== 'all') + Number(selectedToBranch !== 'all');

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Stock Transfers') },
  ];

  const branchOptions = [{ value: 'all', label: t('All') }, ...branches.map((b: any) => ({ value: String(b.id), label: b.name }))];

  const pageActions: PageAction[] = [
    {
      label: t('New Transfer'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => router.get(route('inventory.stock-transfers.create')),
    },
  ];

  const statusBadge = (status: string) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
      status === 'approved' ? 'bg-blue-100 text-blue-700' :
      status === 'accepted' ? 'bg-green-100 text-green-700' :
      status === 'rejected' ? 'bg-red-100 text-red-700' :
      status === 'cancelled' ? 'bg-red-100 text-red-700' :
      'bg-yellow-100 text-yellow-700'
    }`}>
      {t(status)}
    </span>
  );

  return (
    <PageTemplate
      title={t('Stock Transfers')}
      description={t('Batch-wise stock movements between branches')}
      url="/inventory/stock-transfers"
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      noPadding
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-white shadow dark:bg-gray-900">
          <div className="p-4">
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
              filters={[
                {
                  name: 'status',
                  label: t('Status'),
                  type: 'select',
                  options: [{ value: 'all', label: t('All') }, ...statuses.map((s: string) => ({ value: s, label: t(s.charAt(0).toUpperCase() + s.slice(1)) }))],
                  value: selectedStatus,
                  onChange: setSelectedStatus,
                },
                {
                  name: 'from_branch_id',
                  label: t('From Branch'),
                  type: 'select',
                  options: branchOptions,
                  value: selectedFromBranch,
                  onChange: setSelectedFromBranch,
                },
                {
                  name: 'to_branch_id',
                  label: t('To Branch'),
                  type: 'select',
                  options: branchOptions,
                  value: selectedToBranch,
                  onChange: setSelectedToBranch,
                },
              ]}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              onResetFilters={handleResetFilters}
              onApplyFilters={applyFilters}
              currentPerPage={pageFilters.per_page?.toString() || '15'}
              onPerPageChange={(value) => {
                router.get(route('inventory.stock-transfers.index'), {
                  page: 1, per_page: parseInt(value),
                  search: searchTerm || undefined,
                  status: selectedStatus !== 'all' ? selectedStatus : undefined,
                  from_branch_id: selectedFromBranch !== 'all' ? selectedFromBranch : undefined,
                  to_branch_id: selectedToBranch !== 'all' ? selectedToBranch : undefined,
                }, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('Transfer No')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>{t('Product')}</TableHead>
                <TableHead>{t('Batch No')}</TableHead>
                <TableHead>{t('Qty')}</TableHead>
                <TableHead>{t('Unit Price')}</TableHead>
                <TableHead>{t('Total')}</TableHead>
                <TableHead>{t('From → To')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items?.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-gray-400">
                    {t('No stock transfer items found.')}
                  </TableCell>
                </TableRow>
              ) : (
                (items?.data ?? []).map((row: any, idx: number) => (
                  <TableRow key={row.id}>
                    <TableCell>{(items?.from ?? 1) + idx}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-blue-600 hover:underline font-medium"
                        onClick={() => router.get(route('inventory.stock-transfers.show', row.transfer_id))}
                      >
                        {row.transfer_no}
                      </button>
                    </TableCell>
                    <TableCell>{row.transfer_date ? (window.appSettings?.formatDateTime?.(row.transfer_date, false) ?? new Date(row.transfer_date).toLocaleDateString()) : '-'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.product_name}</div>
                      <div className="text-xs text-gray-400">{row.product_sku}</div>
                    </TableCell>
                    <TableCell>{row.batch_no ?? '-'}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{window.appSettings?.formatCurrency?.(row.unit_price) ?? Number(row.unit_price).toFixed(2)}</TableCell>
                    <TableCell>{window.appSettings?.formatCurrency?.(row.total_price) ?? Number(row.total_price).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{row.from_branch_name}</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="text-sm">{row.to_branch_name}</span>
                    </TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => router.get(route('inventory.stock-transfers.show', row.transfer_id))}>
                          {t('View')}
                        </Button>
                        {row.status === 'pending' && (
                          <Button type="button" size="sm" variant="outline" onClick={() => router.get(route('inventory.stock-transfers.edit', row.transfer_id))}>
                            {t('Edit')}
                          </Button>
                        )}
                        {row.status === 'approved' && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                if (!confirm(t('Accept this stock transfer?'))) return;
                                toast.loading(t('Accepting transfer…'));
                                router.post(route('inventory.stock-transfers.accept', row.transfer_id), {}, {
                                  preserveScroll: true,
                                  onSuccess: (page: any) => {
                                    toast.dismiss();
                                    if (page.props?.flash?.success) {
                                      toast.success(t(page.props.flash.success));
                                    } else {
                                      toast.success(t('Stock transfer accepted successfully.'));
                                    }
                                  },
                                  onError: (errors: any) => {
                                    toast.dismiss();
                                    const msg =
                                      typeof errors === 'object'
                                        ? Object.values(errors).flat().join(', ')
                                        : String(errors);
                                    toast.error(msg || t('Could not accept this transfer.'));
                                  },
                                });
                              }}
                            >
                              {t('Accept')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => router.get(route('inventory.stock-transfers.show', row.transfer_id))}
                            >
                              {t('Reject')}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            from={items?.from || 0}
            to={items?.to || 0}
            total={items?.total || 0}
            links={items?.links}
            entityName={t('Items')}
            onPageChange={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
          />
        </div>
      </div>
    </PageTemplate>
  );
}
