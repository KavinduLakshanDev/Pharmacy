import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';

export default function Customers() {
  const { t } = useTranslation();
  const { auth, customers, planLimits, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const isCompany = auth?.user?.type === 'company';

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedType, setSelectedType] = useState(pageFilters.type || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [activeView, setActiveView] = useState('list');

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedType !== 'all';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedType !== 'all' ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = (perPage = pageFilters.per_page ?? 10) => {
    const params: any = {
      page: 1,
      per_page: perPage,
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedType !== 'all') params.type = selectedType;

    router.get(route('customers.index'), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    router.get(route('customers.index'), {
      page: 1,
      per_page: pageFilters.per_page,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePerPageChange = (value: string) => {
    applyFilters(parseInt(value, 10));
  };

  const handleCreate = () => {
    router.visit(route('customers.create'));
  };

  const handleView = (item: any) => {
    router.visit(route('customers.show', item.id));
  };

  const handleEdit = (item: any) => {
    router.visit(route('customers.edit', item.id));
  };

  const handleDelete = (item: any) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    router.delete(route('customers.destroy', currentItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        toast.success(t('Customer deleted successfully'));
      },
    });
  };

  const tableColumns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true,
    },
    {
      key: 'code',
      label: t('Code'),
      sortable: true,
    },
    {
      key: 'email',
      label: t('Email'),
      sortable: true,
    },
    {
      key: 'phone',
      label: t('Phone'),
    },
    {
      key: 'type',
      label: t('Type'),
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'shop'
            ? 'bg-blue-100 text-blue-800'
            : value === 'privileged_customer'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-green-100 text-green-800'
        }`}>
          {value === 'shop'
            ? t('Shop')
            : value === 'privileged_customer'
              ? t('Privileged Customer')
              : t('Customer')}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: t('Created'),
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleTableAction = (action: string, row: any) => {
    switch (action) {
      case 'view':
        handleView(row);
        break;
      case 'edit':
        handleEdit(row);
        break;
      case 'delete':
        handleDelete(row);
        break;
    }
  };

  const tableActions = [
    {
      label: t('View'),
      icon: 'Eye',
      className: 'text-blue-500',
      action: 'view',
      requiredPermission: 'view-customers'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      className: 'text-amber-500',

      action: 'edit',
      requiredPermission: 'edit-customers'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
       className: 'text-red-500',
      requiredPermission: 'delete-customers'
    }
  ];

  const filterOptions = [
    {
      name: 'type',
      label: t('Type'),
      type: 'select' as const,
      options: [
        { value: 'all', label: t('All Types') },
        { value: 'customer', label: t('Customer') },
        { value: 'privileged_customer', label: t('Privileged Customer') },
      ],
      value: selectedType,
      onChange: setSelectedType,
    },
  ];

  return (
    <PageTemplate
    title={t('Customers')}
    description={t('Manage customer records')}
    url="/customers"
    noPadding
    actions={hasPermission(permissions, 'create-customers') ? [
      {
        label: t('Add Customer'),
        icon: <Plus className="w-4 h-4" />,
        variant: 'default',
        onClick: handleCreate,
      }
    ] : []}
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
          currentPerPage={pageFilters.per_page?.toString() || '10'}
          onPerPageChange={handlePerPageChange}
        />
              </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">

        {customers.data.length > 0 ? (
          <CrudTable
            data={customers.data}
            columns={tableColumns}
            actions={tableActions}
            from={customers.from}
            onAction={handleTableAction}
            permissions={permissions}
            entityPermissions={{
              view: 'view-customers',
              edit: 'edit-customers',
              delete: 'delete-customers'
            }}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('No customers found')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t('Get started by creating your first customer.')}
                </p>

              </div>
            </CardContent>
          </Card>
        )}

        <Pagination
          currentPage={customers.current_page}
          lastPage={customers.last_page}
          total={customers.total}
          from={customers.from}
          to={customers.to}
          links={customers.links}
          entityName={t('customers')}
        />

        <CrudDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          itemName={currentItem?.name}
          entityName={t('Customer')}
        />
      </div>
    </PageTemplate>
  );
}
