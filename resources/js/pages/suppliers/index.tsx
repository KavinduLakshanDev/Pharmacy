import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';

export default function Suppliers() {
  const { t } = useTranslation();
  const { suppliers, filters: pageFilters = {} } = usePage().props as any;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
  const [selectedVatStatus, setSelectedVatStatus] = useState(pageFilters.vat_registered ?? 'all');
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedVatStatus !== 'all';
  };

  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedVatStatus !== 'all' ? 1 : 0);
  };

  const applyFilters = (perPage = String(pageFilters.per_page ?? 10)) => {
    const params: Record<string, string> = {
      page: '1',
      per_page: perPage,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedVatStatus !== 'all') {
      params.vat_registered = selectedVatStatus;
    }

    router.get(route('suppliers.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedVatStatus('all');

    router.get(route('suppliers.index'), {
      page: 1,
      per_page: pageFilters.per_page ?? 10,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePerPageChange = (value: string) => {
    applyFilters(value);
  };

  const handleCreate = () => {
    router.visit(route('suppliers.create'));
  };

  const handleView = (item: any) => {
    router.visit(route('suppliers.show', item.id));
  };

  const handleEdit = (item: any) => {
    router.visit(route('suppliers.edit', item.id));
  };

  const handleDelete = (item: any) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!currentItem) {
      return;
    }

    router.delete(route('suppliers.destroy', currentItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setCurrentItem(null);
        toast.success(t('Supplier deleted successfully'));
      },
    });
  };

  const tableColumns = [
    {
      key: 'company_name',
      label: t('Company Name'),
      sortable: true,
    },
    {
      key: 'mail',
      label: t('Email'),
    },
    {
      key: 'tel_no',
      label: t('Telephone'),
    },
    {
      key: 'contact_person_name',
      label: t('Contact Person'),
    },
    {
      key: 'vat_registered',
      label: t('VAT Status'),
      render: (value: string) => value === 'registered' ? t('Registered') : t('Not Registered'),
    },
    {
      key: 'created_at',
      label: t('Created'),
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const filterOptions = [
    {
      name: 'vat_registered',
      label: t('VAT Status'),
      type: 'select' as const,
      options: [
        { value: 'all', label: t('All Statuses') },
        { value: 'registered', label: t('Registered') },
        { value: 'not_registered', label: t('Not Registered') },
      ],
      value: selectedVatStatus,
      onChange: setSelectedVatStatus,
    },
  ];

  const tableActions = [
    {
      label: t('View'),
      icon: 'Eye',
      className: 'text-blue-500',
      action: 'view',
    },
    {
      label: t('Edit'),
      icon: 'Edit',
        className: 'text-amber-500',
      action: 'edit',
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
       className: 'text-red-500',
      action: 'delete',
    },
  ];

  const handleTableAction = (action: string, row: any) => {
    if (action === 'view') {
      handleView(row);
      return;
    }

    if (action === 'edit') {
      handleEdit(row);
      return;
    }

    if (action === 'delete') {
      handleDelete(row);
    }
  };

  return (
    <PageTemplate
      title={t('Suppliers')}
      description={t('Manage supplier records')}
      url="/suppliers"
      noPadding
      actions={[
        {
          label: t('Add Supplier'),
          icon: <Plus className="w-4 h-4" />,
          variant: 'default',
          onClick: handleCreate,
        },
      ]}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={filterOptions}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={clearFilters}
          onApplyFilters={() => applyFilters()}
          currentPerPage={String(pageFilters.per_page ?? 10)}
          onPerPageChange={handlePerPageChange}
        />
         </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">

        {suppliers.data.length > 0 ? (
          <CrudTable
            data={suppliers.data}
            columns={tableColumns}
            actions={tableActions}
            from={suppliers.from ?? 0}
            onAction={handleTableAction}
            permissions={[]}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('No suppliers found')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t('Get started by creating your first supplier.')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Pagination
          currentPage={suppliers.current_page}
          lastPage={suppliers.last_page}
          total={suppliers.total}
          from={suppliers.from}
          to={suppliers.to}
          links={suppliers.links}
          entityName={t('suppliers')}
        />

        <CrudDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          itemName={currentItem?.company_name}
          entityName={t('Supplier')}
        />
      </div>
    </PageTemplate>
  );
}
