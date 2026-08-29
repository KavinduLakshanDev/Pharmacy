import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';

export default function DrugForms() {
  const { t } = useTranslation();
  const { auth, drugForms, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const hasActiveFilters = () => searchTerm !== '' || selectedStatus !== 'all';

  const activeFilterCount = () => (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(
      route('drug-forms.index'),
      {
        page: 1,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        per_page: pageFilters.per_page,
      },
      { preserveState: true, preserveScroll: true },
    );
  };

  const handleSort = (field: string) => {
    const direction =
      pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

    router.get(
      route('drug-forms.index'),
      {
        sort_field: field,
        sort_direction: direction,
        page: 1,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        per_page: pageFilters.per_page,
      },
      { preserveState: true, preserveScroll: true },
    );
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        setFormMode('view');
        setIsFormModalOpen(true);
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'toggle-status':
        handleToggleStatus(item);
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      toast.loading(t('Creating drug form...'));

      router.post(route('drug-forms.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          const flash = page.props.flash as { success?: string; error?: string };
          if (flash?.success) {
            toast.success(t(flash.success));
          } else if (flash?.error) {
            toast.error(t(flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(
              t('Failed to create drug form: {{errors}}', {
                errors: Object.values(errors).join(', '),
              }),
            );
          }
        },
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating drug form...'));

      router.put(route('drug-forms.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          const flash = page.props.flash as { success?: string; error?: string };
          if (flash?.success) {
            toast.success(t(flash.success));
          } else if (flash?.error) {
            toast.error(t(flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(
              t('Failed to update drug form: {{errors}}', {
                errors: Object.values(errors).join(', '),
              }),
            );
          }
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting drug form...'));

    router.delete(route('drug-forms.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        const flash = page.props.flash as { success?: string; error?: string };
        if (flash?.success) {
          toast.success(t(flash.success));
        } else if (flash?.error) {
          toast.error(t(flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(
            t('Failed to delete drug form: {{errors}}', {
              errors: Object.values(errors).join(', '),
            }),
          );
        }
      },
    });
  };

  const handleToggleStatus = (item: any) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    toast.loading(
      `${newStatus === 'active' ? t('Activating') : t('Deactivating')} ${t('drug form')}...`,
    );

    router.put(route('drug-forms.toggle-status', item.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        const flash = page.props.flash as { success?: string; error?: string };
        if (flash?.success) {
          toast.success(t(flash.success));
        } else if (flash?.error) {
          toast.error(t(flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(
            t('Failed to update drug form status: {{errors}}', {
              errors: Object.values(errors).join(', '),
            }),
          );
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setShowFilters(false);

    router.get(
      route('drug-forms.index'),
      { page: 1, per_page: pageFilters.per_page },
      { preserveState: true, preserveScroll: true },
    );
  };

  const pageActions = [];

  if (hasPermission(permissions, 'create-drug-forms')) {
    pageActions.push({
      label: t('Add Drug Form'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default' as const,
      onClick: () => handleAddNew(),
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Product Setup'), href: route('drug-forms.index') },
    { title: t('Drug Forms') },
  ];

  const columns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true,
    },
    {
      key: 'description',
      label: t('Description'),
      render: (value: string) => value || '-',
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            value === 'active'
              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
              : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
          }`}
        >
          {value === 'active' ? t('Active') : t('Inactive')}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: t('Created At'),
      sortable: true,
      render: (value: string) =>
        window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString(),
    },
  ];

  const actions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-drug-forms',
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-drug-forms',
    },
    {
      label: t('Toggle Status'),
      icon: 'Lock',
      action: 'toggle-status',
      className: 'text-amber-500',
      requiredPermission: 'toggle-status-drug-forms',
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-drug-forms',
    },
  ];

  const statusOptions = [
    { value: 'all', label: t('All Statuses') },
    { value: 'active', label: t('Active') },
    { value: 'inactive', label: t('Inactive') },
  ];

  return (
    <PageTemplate
      title={t('Drug Forms')}
      description={t('Manage drug dosage forms')}
      url="/drug-forms"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'status',
              label: t('Status'),
              type: 'select',
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: statusOptions,
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
            router.get(
              route('drug-forms.index'),
              {
                page: 1,
                per_page: parseInt(value),
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
              },
              { preserveState: true, preserveScroll: true },
            );
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={drugForms?.data || []}
          from={drugForms?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-drug-forms',
            edit: 'edit-drug-forms',
            delete: 'delete-drug-forms',
          }}
        />

        <Pagination
          from={drugForms?.from || 0}
          to={drugForms?.to || 0}
          total={drugForms?.total || 0}
          links={drugForms?.links}
          entityName={t('drug forms')}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { name: 'name', label: t('Drug Form Name'), type: 'text', required: true },
            { name: 'description', label: t('Description'), type: 'textarea' },
            {
              name: 'status',
              label: t('Status'),
              type: 'select',
              options: [
                { value: 'active', label: t('Active') },
                { value: 'inactive', label: t('Inactive') },
              ],
              defaultValue: 'active',
            },
          ],
          modalSize: 'lg',
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? t('Add New Drug Form')
            : formMode === 'edit'
              ? t('Edit Drug Form')
              : t('View Drug Form')
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName={t('drug form')}
      />
    </PageTemplate>
  );
}
