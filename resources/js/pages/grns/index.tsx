import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';


export default function GrnIndex() {
  const { t } = useTranslation();
  const { auth, grns, statuses = [], filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('grns.index'), {
      page: 1,
      search: searchTerm || undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('grns.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    // Prevent editing approved GRNs
    if (action === 'edit' && item.status === 'approved') {
      toast.error(t('Approved GRNs cannot be edited.'));
      return;
    }

    switch (action) {
      case 'view':
        router.get(route('grns.show', item.id));
        break;
      case 'edit':
        router.get(route('grns.edit', item.id));
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const handleAddNew = () => {
    router.get(route('grns.create'));
  };

  const handleDeleteConfirm = () => {
    if (!currentItem) return;
    router.delete(route('grns.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
      }
    });
  };

  const hasActiveFilters = () => {
    return searchTerm !== '';
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setShowFilters(false);

    router.get(route('grns.index'), {
      page: 1,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('GRN') },
  ];

  const columns = [
    { key: 'grn_no', label: t('GRN Number'), sortable: true, render: (value: any, row: any) => (
      <Link href={route('grns.show', row.id)} className="text-blue-600 hover:underline">{value}</Link>
    ) },
    { key: 'batch_no', label: t('Batch No'), sortable: true },
    { key: 'supplier.company_name', label: t('Supplier'), sortable: true },
    { key: 'total_amount', label: t('Total Amount'), sortable: true },
  ];

  const actions = [
    { action: 'view', label: t('View'), icon: 'Eye', requiredPermission: 'view-grns' },
    { action: 'edit', label: t('Edit'), icon: 'Edit', requiredPermission: 'manage-grns' },
    { action: 'delete', label: t('Delete'), icon: 'Trash2', requiredPermission: 'manage-grns' },
  ];

  const entityPermissions = {
    view: 'view-grns',
    edit: 'manage-grns',
    delete: 'manage-grns',
  };

  return (
    <PageTemplate
      title={t('GRN')}
      description={t('Manage Goods Received Notes')}
      url="/grns"
      breadcrumbs={breadcrumbs}
      actions={[
        {
          label: t('Add GRN'),
          icon: <Plus className="h-4 w-4 mr-2" />,
          variant: 'default',
          onClick: handleAddNew,
        },
      ]}
      noPadding
    >
      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
                filters={[]}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={() => (hasActiveFilters() ? 1 : 0)}
                onResetFilters={handleResetFilters}
                currentPerPage={pageFilters.per_page?.toString() || '10'}
                onPerPageChange={(value) => {
                  router.get(route('grns.index'), {
                    page: 1,
                    per_page: parseInt(value),
                    search: searchTerm || undefined,
                  }, { preserveState: true, preserveScroll: true });
                }}
              />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <CrudTable
              columns={columns}
              actions={actions}
              data={grns?.data || []}
              from={grns?.from || 0}
              onAction={handleAction}
              sortField={pageFilters.sort_field}
              sortDirection={pageFilters.sort_direction}
              onSort={handleSort}
              permissions={permissions}
              entityPermissions={entityPermissions}
            />

            <Pagination
              from={grns?.from || 0}
              to={grns?.to || 0}
              total={grns?.total || 0}
              links={grns?.links}
              entityName={t('GRNs')}
              onPageChange={(url) => router.get(url)}
            />
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.grn_no}
        entityName={t('GRN')}
      />
    </PageTemplate>
  );
}
