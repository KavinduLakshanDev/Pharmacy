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

export default function Branches() {
  const { t } = useTranslation();
  const { auth, branches, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedStatus !== 'all';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('branches.index'), {
      page: 1,
      search: searchTerm || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

    router.get(route('branches.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
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
      toast.loading(t('Creating branch...'));

      router.post(route('branches.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if ((page.props as any).flash.success) {
            toast.success(t((page.props as any).flash.success));
          } else if ((page.props as any).flash.error) {
            toast.error(t((page.props as any).flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to create branch: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating branch...'));

      router.put(route('branches.update', currentItem?.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if ((page.props as any).flash.success) {
            toast.success(t((page.props as any).flash.success));
          } else if ((page.props as any).flash.error) {
            toast.error(t((page.props as any).flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to update branch: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting branch...'));

    router.delete(route('branches.destroy', currentItem?.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if ((page.props as any).flash.success) {
          toast.success(t((page.props as any).flash.success));
        } else if ((page.props as any).flash.error) {
          toast.error(t((page.props as any).flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to delete branch: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleToggleStatus = (branch: any) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} branch...`);

    router.put(route('branches.toggle-status', branch.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        if ((page.props as any).flash.success) {
          toast.success(t((page.props as any).flash.success));
        } else if ((page.props as any).flash.error) {
          toast.error(t((page.props as any).flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to update branch status: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setShowFilters(false);

    router.get(route('branches.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions: Array<{
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: () => void;
  }> = [];

  // Add the "Add New Branch" button if user has permission
  if (hasPermission(permissions, 'create-branches')) {
    pageActions.push({
      label: t('Add Branch'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Branches') }
  ];

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true
    },
    {
      key: 'address',
      label: t('Address'),
      render: (value: any) => value || '-'
    },
    {
      key: 'phone',
      label: t('Phone'),
      render: (value: any) => value || '-'
    },
    {
      key: 'email',
      label: t('Email'),
      render: (value: any) => value || '-'
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: any) => {
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${value === 'active'
            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
            }`}>
            {value === 'active' ? t('Active') : t('Inactive')}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      label: t('Created At'),
      sortable: true,
      render: (value: any) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  // Define table actions
  const actions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-branches'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-branches'
    },
    {
      label: t('Toggle Status'),
      icon: 'Lock',
      action: 'toggle-status',
      className: 'text-amber-500',
      requiredPermission: 'toggle-status-branches'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-branches'
    }
  ];

  // Prepare status options for filter
  const statusOptions = [
    { value: 'all', label: t('All Statuses') },
    { value: 'active', label: t('Active') },
    { value: 'inactive', label: t('Inactive') }
  ];

  return (
    <PageTemplate
      title={t("Branches")}
      url="/branches"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'status',
              label: t('Status'),
              type: 'select' as const,
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: statusOptions
            }
          ]}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value: string) => {
            router.get(route('branches.index'), {
              page: 1,
              per_page: parseInt(value),
              search: searchTerm || undefined,
              status: selectedStatus !== 'all' ? selectedStatus : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={branches?.data || []}
          from={branches?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction as 'asc' | 'desc' | undefined}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-branches',
            edit: 'edit-branches',
            delete: 'delete-branches'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={branches?.from || 0}
          to={branches?.to || 0}
          total={branches?.total || 0}
          links={branches?.links}
          entityName={t("branches")}
          onPageChange={(url: string) => router.get(url)}
        />
      </div>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { name: 'name', label: t('Branch Name'), type: 'text', required: true },
            { name: 'address', label: t('Address'), type: 'textarea', required: true },
            { name: 'phone', label: t('Phone'), type: 'text' },
            { name: 'email', label: t('Email'), type: 'email' },
            {
              name: 'status',
              label: t('Status'),
              type: 'select',
              options: [
                { value: 'active', label: t('Active') },
                { value: 'inactive', label: t('Inactive') }
              ],
              defaultValue: 'active'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? t('Add New Branch')
            : formMode === 'edit'
              ? t('Edit Branch')
              : t('View Branch')
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName={t('branch')}
      />
    </PageTemplate>
  );
}
