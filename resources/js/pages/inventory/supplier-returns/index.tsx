import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';

export default function SupplierReturnsPage() {
    const { t } = useTranslation();
    const { auth, supplierReturns = [], branches = [], filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedBranch, setSelectedBranch] = useState(pageFilters.branch_id || 'all');
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedBranch !== 'all';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) + (selectedBranch !== 'all' ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(route('inventory.supplier-returns.index'), {
            page: 1,
            search: searchTerm || undefined,
            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        router.get(route('inventory.supplier-returns.index'), {
            sort_field: field,
            sort_direction: direction,
            page: 1,
            search: searchTerm || undefined,
            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        if (action === 'view') {
            router.visit(route('inventory.supplier-returns.create') + `?view=${item.id}`);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedBranch('all');
        setShowFilters(false);

        router.get(route('inventory.supplier-returns.index'), {
            page: 1,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Supplier Returns') },
    ];

    const formatMoney = (value: number) => {
        const amount = Number.isFinite(value) ? value : 0;
        return window.appSettings?.formatCurrency?.(amount) || `Rs. ${amount.toFixed(2)}`;
    };

    const columns = [
        {
            key: 'return_number',
            label: t('Return No'),
            sortable: true,
            render: (value: any) => (
                <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-sm">{value}</span>
                </div>
            )
        },
        {
            key: 'supplier',
            label: t('Supplier'),
            render: (value: any) => (
                <div>
                    <div className="font-medium">{value?.company_name || '—'}</div>
                    {value?.contact_person_name && (
                        <div className="text-xs text-gray-500">{value.contact_person_name}</div>
                    )}
                </div>
            )
        },
        {
            key: 'branch',
            label: t('Branch'),
            render: (value: any) => value?.name || '—'
        },
        {
            key: 'grn',
            label: t('GRN'),
            render: (value: any) => value?.invoice_no || value?.grn_no || '—'
        },
        {
            key: 'return_date',
            label: t('Date'),
            sortable: true,
            render: (value: any) => value ? new Date(value).toLocaleDateString() : '—'
        },
        {
            key: 'items_count',
            label: t('Items'),
            sortable: true,
            render: (value: any) => (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {value}
                </span>
            )
        },
        {
            key: 'total_amount',
            label: t('Amount'),
            sortable: true,
            render: (value: any) => (
                <span className="font-semibold text-green-600">
                    {formatMoney(Number(value))}
                </span>
            )
        },
    ];

    const actions = [
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
        },
    ];

    const branchOptions = [
        { value: 'all', label: t('All Branches') },
        ...(branches || []).map((branch: any) => ({
            value: branch.id.toString(),
            label: branch.name
        }))
    ];

    const pageActions = [
        {
            label: t('Add Supplier Return'),
            icon: <Plus className="h-4 w-4 mr-2" />,
            variant: 'default' as const,
            onClick: () => router.visit(route('inventory.supplier-returns.create')),
        },
    ];

    return (
        <PageTemplate
            title={t('Supplier Returns')}
            description={t('Review supplier returns and create new ones.')}
            url="/inventory/supplier-returns"
            breadcrumbs={breadcrumbs}
            actions={pageActions}
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
                            name: 'branch_id',
                            label: t('Branch'),
                            type: 'select' as const,
                            value: selectedBranch,
                            onChange: setSelectedBranch,
                            options: branchOptions
                        }
                    ]}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={applyFilters}
                    currentPerPage={pageFilters.per_page?.toString() || "10"}
                    onPerPageChange={(value) => {
                        router.get(route('inventory.supplier-returns.index'), {
                            page: 1,
                            per_page: parseInt(value),
                            search: searchTerm || undefined,
                            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
                        }, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            {/* Content section */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={supplierReturns?.data || []}
                    from={supplierReturns?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                />

                {/* Pagination section */}
                <Pagination
                    from={supplierReturns?.from || 0}
                    to={supplierReturns?.to || 0}
                    total={supplierReturns?.total || 0}
                    links={supplierReturns?.links}
                    entityName={t("supplier returns")}
                    onPageChange={(url) => router.get(url)}
                />
            </div>
        </PageTemplate>
    );
}
