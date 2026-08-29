import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { hasPermission } from '@/utils/authorization';
import { router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DeliveryRoutes() {
    const { t } = useTranslation();
    const { auth, deliveryRoutes, filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];

    // State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [showFilters, setShowFilters] = useState(false);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return searchTerm ? 1 : 0;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('delivery-routes.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            route('delivery-routes.index'),
            {
                ...pageFilters,
                per_page: perPage,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        router.get(
            route('delivery-routes.index'),
            {
                ...pageFilters,
                sort_field: field,
                sort_direction: direction,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleCreate = () => {
        router.visit(route('delivery-routes.create'));
    };

    const handleView = (item: any) => {
        router.visit(route('delivery-routes.show', item.id));
    };

    const handleEdit = (item: any) => {
        router.visit(route('delivery-routes.edit', item.id));
    };

    const handleDelete = (item: any) => {
        setCurrentItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!currentItem) {
            return;
        }

        router.delete(route('delivery-routes.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setCurrentItem(null);
                toast.success(t('Delivery route deleted successfully'));
            },
            onError: () => {
                toast.error(t('Failed to delete delivery route'));
            },
        });
    };

    const handleAction = (action: string, item: any) => {
        switch (action) {
            case 'view':
                handleView(item);
                break;
            case 'edit':
                handleEdit(item);
                break;
            case 'delete':
                handleDelete(item);
                break;
        }
    };

    const breadcrumbs = [{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Delivery Routes') }];

    const pageActions = hasPermission(permissions, 'create-delivery-routes')
        ? [
              {
                  label: t('Create Delivery Route'),
                  icon: <Plus className="mr-2 h-4 w-4" />,
                  variant: 'default',
                  onClick: handleCreate,
              },
          ]
        : [];

    // Define table columns
    const columns = [
        {
            key: 'routename',
            label: t('Route Name'),
            sortable: true,
            render: (value: any) => <span className="font-semibold text-gray-900 dark:text-white">{value}</span>,
        },
        {
            key: 'routecode',
            label: t('Route Code'),
            sortable: true,
            render: (value: any) => <code className="bg-muted rounded px-2 py-1 font-mono text-sm">{value}</code>,
        },
        {
            key: 'description',
            label: t('Description'),
            render: (value: any) => <span className="text-muted-foreground">{value || t('No description')}</span>,
        },
        {
            key: 'created_at',
            label: t('Created At'),
            sortable: true,
            render: (value: string) => new Date(value).toLocaleDateString(),
        },
    ];

    // Define table actions
    const actions = [
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-delivery-routes',
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-delivery-routes',
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-delivery-routes',
        },
    ];

    return (
        <PageTemplate
            title={t('Delivery Routes')}
            description={t('Manage delivery routes for your application')}
            url={route('delivery-routes.index')}
            breadcrumbs={breadcrumbs}
            actions={pageActions}
            noPadding
        >
            <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    activeFilterCount={activeFilterCount}
                    hasActiveFilters={hasActiveFilters}
                    onResetFilters={() => {
                        setSearchTerm('');
                        applyFilters();
                    }}
                    currentPerPage={String(pageFilters.per_page || 10)}
                    onPerPageChange={(value) => handlePerPageChange(parseInt(value))}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={deliveryRoutes.data}
                    from={deliveryRoutes.from}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        view: 'view-delivery-routes',
                        edit: 'edit-delivery-routes',
                        delete: 'delete-delivery-routes',
                    }}
                />

                <Pagination
                    from={deliveryRoutes.from}
                    to={deliveryRoutes.to}
                    total={deliveryRoutes.total}
                    links={deliveryRoutes.links}
                    entityName={t('delivery routes')}
                    onPageChange={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
                />

                <CrudDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    itemName={currentItem?.routename}
                    entityName={t('Delivery Route')}
                />
            </div>
        </PageTemplate>
    );
}
