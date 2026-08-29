import { useState } from 'react';
import { PageTemplate, type PageAction } from '@/components/page-template';
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

interface PosSession {
  id: number;
  session_number: string;
  user_id: number;
  branch_id: number;
  cash_register_id: number;
  opening_balance: string;
  closing_balance?: string;
  expected_balance?: string;
  difference?: string;
  total_sales?: number;
  total_sales_amount?: string;
  status: 'active' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  user?: { name: string };
  cash_register?: { name: string; register_code: string };
  branch?: { name: string };
}

interface CashRegister {
  id: number;
  name: string;
  register_code: string;
}

interface PageFilters {
  search?: string;
  status?: string;
  per_page?: number;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
}

interface PageProps extends Record<string, any> {
  auth: {
    user: any;
    permissions: string[];
  };
  posSessions: {
    data: PosSession[];
    from: number;
    to: number;
    total: number;
    links: any[];
  };
  cashRegisters: CashRegister[];
  filters: PageFilters;
  flash: {
    success?: string;
    error?: string;
  };
}

export default function PosSessions() {
  const { t } = useTranslation();
  const { auth, posSessions, cashRegisters, filters: pageFilters = {} } = usePage<PageProps>().props;
  const permissions = auth?.permissions || [];

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<PosSession | null>(null);
  const [currentCloseItem, setCurrentCloseItem] = useState<PosSession | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'view' | 'edit'>('create');

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
    router.get(route('pos-sessions.index'), {
      page: 1,
      search: searchTerm || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

    router.get(route('pos-sessions.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: PosSession) => {
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
      case 'close':
        handleCloseSession(item);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
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
      toast.loading(t('Starting POS session...'));

      router.post(route('pos-sessions.store'), formData, {
        onSuccess: (page: any) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors: any) => {
          toast.dismiss();
          const errorsList = typeof errors === 'object' ? Object.values(errors).join(', ') : errors;
          toast.error(t('Failed to start POS session: {{errors}}', { errors: errorsList }));
        }
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating POS session...'));

      router.put(route('pos-sessions.update', currentItem?.id), formData, {
        onSuccess: (page: any) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors: any) => {
          toast.dismiss();
          const errorsList = typeof errors === 'object' ? Object.values(errors).join(', ') : errors;
          toast.error(t('Failed to update POS session: {{errors}}', { errors: errorsList }));
        }
      });
    }
  };

  const handleCloseSession = (session: PosSession) => {
    setCurrentCloseItem(session);
    setIsCloseModalOpen(true);
  };

  const handleCloseFormSubmit = (formData: any) => {
    toast.loading(t('Closing POS session...'));

    router.put(route('pos-sessions.close', currentCloseItem?.id), formData, {
      onSuccess: (page: any) => {
        toast.dismiss();
        setIsCloseModalOpen(false);
        setCurrentCloseItem(null);
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors: any) => {
        toast.dismiss();
        const errorsList = typeof errors === 'object' ? Object.values(errors).join(', ') : errors;
        toast.error(t('Failed to close POS session: {{errors}}', { errors: errorsList }));
      }
    });
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting POS session...'));

    router.delete(route('pos-sessions.destroy', currentItem?.id), {
      onSuccess: (page: any) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors: any) => {
        toast.dismiss();
        const errorsList = typeof errors === 'object' ? Object.values(errors).join(', ') : errors;
        toast.error(t('Failed to delete POS session: {{errors}}', { errors: errorsList }));
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setShowFilters(false);

    router.get(route('pos-sessions.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
    const pageActions: PageAction[] = [];

  // Add the "Start New Session" button if user has permission
  if (hasPermission(permissions, 'create-pos-sessions')) {
    pageActions.push({
      label: t('Start New Session {~ DEV ~}'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('POS Sessions') }
  ];

  // Define table columns
  const columns = [
    {
      key: 'session_number',
      label: t('Session Number'),
      sortable: true
    },
    {
      key: 'user.name',
      label: t('User'),
      render: (_value: any, item: PosSession) => item.user?.name || '-'
    },
    {
      key: 'cashRegister.name',
      label: t('Cash Register'),
      render: (_value: any, item: PosSession) => item.cash_register?.name || '-'
    },
    {
      key: 'branch.name',
      label: t('Branch'),
      render: (_value: any, item: PosSession) => item.branch?.name || '-'
    },
    {
      key: 'opening_balance',
      label: t('Opening'),
      render: (value: any) => value ? `$${parseFloat(value).toFixed(2)}` : '-'
    },
    {
      key: 'total_sales_amount',
      label: t('Sales'),
      render: (value: any) => value ? `$${parseFloat(value).toFixed(2)}` : '$0.00'
    },
    {
      key: 'expected_balance',
      label: t('Expected'),
      render: (value: any, item: PosSession) => {
        const expected = item.status === 'active' 
          ? parseFloat(item.opening_balance || '0') + parseFloat(item.total_sales_amount || '0')
          : parseFloat(value || '0');
        return `$${expected.toFixed(2)}`;
      }
    },
    {
      key: 'closing_balance',
      label: t('Closing'),
      render: (value: any) => value ? `$${parseFloat(value).toFixed(2)}` : '-'
    },
    {
      key: 'difference',
      label: t('Diff'),
      render: (value: any, item: PosSession) => {
        if (item.status === 'active') return '-';
        const val = parseFloat(value || '0');
        const color = val === 0 ? 'text-gray-500' : val > 0 ? 'text-green-600' : 'text-red-600';
        return <span className={`font-medium ${color}`}>{`$${val.toFixed(2)}`}</span>;
      }
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: any) => {
        const statusColors: Record<string, string> = {
          active: 'bg-green-50 text-green-700 ring-green-600/20',
          closed: 'bg-blue-50 text-blue-700 ring-blue-600/20'
        };
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusColors[value as string] || 'bg-gray-50 text-gray-700'}`}>
            {t((value as string).charAt(0).toUpperCase() + (value as string).slice(1))}
          </span>
        );
      }
    },
    {
      key: 'opened_at',
      label: t('Opened At'),
      sortable: true,
      render: (value: any) => (window as any).appSettings?.formatDateTime(value) || new Date(value).toLocaleString()
    },
    {
      key: 'closed_at',
      label: t('Closed At'),
      render: (value: any) => value ? ((window as any).appSettings?.formatDateTime(value) || new Date(value).toLocaleString()) : '-'
    }
  ];

  // Define table actions
  const actions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-pos-sessions'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-pos-sessions',
      condition: (item: PosSession) => item.status === 'active' // Only allow edit for active sessions
    },
    {
      label: t('Close Session'),
      icon: 'X',
      action: 'close',
      className: 'text-red-500',
      requiredPermission: 'close-pos-sessions',
      condition: (item: PosSession) => item.status === 'active'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-pos-sessions'
    }
  ];

  // Prepare status options for filter
  const statusOptions = [
    { value: 'all', label: t('All Statuses') },
    { value: 'active', label: t('Active') },
    { value: 'closed', label: t('Closed') }
  ];

  // Prepare cash register options for form
  const cashRegisterOptions = cashRegisters?.map(register => ({
    value: register.id,
    label: `${register.name} (${register.register_code})`
  })) || [];

  return (
    <PageTemplate
      title={t("POS Sessions")}
      description={t("Manage point of sale sessions and cash reconciliation")}
      url="/pos-sessions"
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
              type: 'select',
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
            router.get(route('pos-sessions.index'), {
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
          data={posSessions?.data || []}
          from={posSessions?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-pos-sessions',
            edit: 'edit-pos-sessions',
            delete: 'delete-pos-sessions'
          } as any}
        />

        {/* Pagination section */}
        <Pagination
          from={posSessions?.from || 0}
          to={posSessions?.to || 0}
          total={posSessions?.total || 0}
          links={posSessions?.links}
          entityName={t("POS sessions")}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: formMode === 'create' ? [
            {
              name: 'cash_register_id',
              label: t('Cash Register'),
              type: 'select',
              required: true,
              options: cashRegisterOptions
            },
            { name: 'opening_balance', label: t('Opening Balance'), type: 'number', step: '0.01', required: true },
            { name: 'notes', label: t('Notes'), type: 'textarea' }
          ] : [
            { name: 'closing_balance', label: t('Closing Balance'), type: 'number', step: '0.01' },
            { name: 'expected_balance', label: t('Expected Balance'), type: 'number', step: '0.01' },
            { name: 'difference', label: t('Difference'), type: 'number', step: '0.01' },
            { name: 'total_sales', label: t('Total Sales'), type: 'number', min: '0' },
            { name: 'total_sales_amount', label: t('Total Sales Amount'), type: 'number', step: '0.01' },
            { name: 'notes', label: t('Notes'), type: 'textarea' }
          ] as any[],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? t('Start New POS Session {~ DEV ~}')
            : formMode === 'edit'
              ? t('Edit POS Session')
              : t('View POS Session')
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.session_number || ''}
        entityName={t('POS session')}
      />

      {/* Close Session Modal */}
      <CrudFormModal
        isOpen={isCloseModalOpen}
        onClose={() => {
          setIsCloseModalOpen(false);
          setCurrentCloseItem(null);
        }}
        onSubmit={handleCloseFormSubmit}
        formConfig={{
          fields: [
            { 
              name: 'expected_info', 
              label: t('Expected Balance'), 
              type: 'custom', 
              render: () => (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 flex justify-between items-center border border-blue-100">
                  <span className="text-blue-700 text-sm font-medium">{t('Expected Amount in Cash Register')}:</span>
                  <span className="text-blue-900 font-bold text-lg">
                    {`$${(parseFloat(currentCloseItem?.opening_balance || '0') + parseFloat(currentCloseItem?.total_sales_amount || '0')).toFixed(2)}`}
                  </span>
                </div>
              )
            },
            { name: 'closing_balance', label: t('Closing Balance (Actual Cash)'), type: 'number', step: '0.01', required: true },
            { name: 'notes', label: t('Notes'), type: 'textarea' }
          ] as any[],
          modalSize: 'md'
        }}
        initialData={currentCloseItem}
        title={t('Close POS Session')}
        mode="edit"
      />
    </PageTemplate>
  );
}
