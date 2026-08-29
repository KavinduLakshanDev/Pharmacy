import { useState } from 'react';
import { PageTemplate, type PageAction } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { showToast } from '@/components/ui/toast-notification';
import { usePage, router } from '@inertiajs/react';
import { Plus, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function WastageIndex() {
  const { t } = useTranslation();
  const { auth, wastages, branches = [], filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(pageFilters.branch_id || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('inventory.wastages.index'), {
      page: 1,
      search: searchTerm || undefined,
      branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('inventory.wastages.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        router.get(route('inventory.wastages.show', item.id));
        break;
      case 'approve':
        router.post(route('inventory.wastages.approve', item.id), {}, {
          onSuccess: () => router.reload(),
        });
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const handleNew = () => {
    router.get(route('inventory.wastages.create'));
  };

  const handleDeleteConfirm = () => {
    if (!currentItem) return;

    router.delete(route('inventory.wastages.destroy', currentItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
      },
    });
  };

  const hasActiveFilters = () => {
    return (
      Boolean(searchTerm) ||
      selectedBranch !== 'all'
    );
  };

  const activeFilterCount = () => {
    return (
      Number(Boolean(searchTerm)) +
      Number(selectedBranch !== 'all')
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBranch('all');
    setShowFilters(false);

    router.get(route('inventory.wastages.index'), {
      page: 1,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const branchesOptions = [{ value: 'all', label: t('All') }, ...branches.map((branch: any) => ({ value: branch.id, label: branch.name }))];

  const columns = [
    { key: 'wastage_no', label: t('Wastage No'), sortable: true },
    {
      key: 'branch.name',
      label: t('Branch'),
      render: (_value: any, row: any) => row.branch?.name || t('-'),
    },
    { key: 'wastage_date', label: t('Date'), sortable: true, render: (value: any) => value ? window.appSettings?.formatDateTime?.(value, false) ?? new Date(value).toLocaleDateString() : t('-') },
    { key: 'total_amount', label: t('Total Amount'), sortable: true, render: (value: any) => window.appSettings?.formatCurrency?.(Number(value ?? 0)) ?? Number(value ?? 0).toFixed(2) },
  ];

  const actions = [
    { action: 'view', label: t('View'), icon: 'Eye', requiredPermission: ['manage-inventory'] },
    { action: 'approve', label: t('Approve'), icon: 'CheckCircle', requiredPermission: ['manage-inventory'], condition: (row: any) => row.status === 'pending' },
    { action: 'delete', label: t('Delete'), icon: 'Trash2', requiredPermission: ['manage-inventory'] },
  ];

  const pageActions: PageAction[] = [
    {
      label: t('New Wastage'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: handleNew,
    },
    {
      label: t('Print'),
      icon: <Printer className="h-4 w-4 mr-2" />,
      variant: 'ghost',
      onClick: () => showToast(t('Print functionality is not implemented yet.'), 'info'),
    },
  ];

  return (
    <PageTemplate
      title={t('Wastages')}
      description={t('Record inventory wastage and view wastage history.')}
      url="/inventory/wastages"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Wastages') },
      ]}
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
                  name: 'branch_id',
                  label: t('Branch'),
                  type: 'select',
                  options: branchesOptions,
                  value: selectedBranch,
                  onChange: setSelectedBranch,
                },
              ]}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              onResetFilters={handleResetFilters}
              onApplyFilters={applyFilters}
              currentPerPage={pageFilters.per_page?.toString() || '10'}
              onPerPageChange={(value) => {
                router.get(route('inventory.wastages.index'), {
                  page: 1,
                  per_page: Number(value),
                  search: searchTerm || undefined,
                  branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
                }, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
          <CrudTable
            columns={columns}
            actions={actions}
            data={wastages.data}
            from={wastages.from ?? 1}
            onAction={handleAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction as 'asc' | 'desc' | undefined}
            onSort={handleSort}
            permissions={permissions}
            entityPermissions={{
              view: 'manage-inventory',
              edit: 'manage-inventory',
              delete: 'manage-inventory',
            }}
          />

          <Pagination
            from={wastages.from}
            to={wastages.to}
            total={wastages.total}
            links={wastages.links}
            currentPage={wastages.current_page}
            lastPage={wastages.last_page}
            entityName={t('wastages')}
            onPageChange={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
          />
        </div>
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={t('this wastage record')}
        entityName={t('wastages')}
      />
    </PageTemplate>
  );
}
