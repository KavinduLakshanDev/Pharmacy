import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';

export default function CustomerReturnsPage() {
    const { t } = useTranslation();
    const { auth, customerReturns = [], branches = [], filters: pageFilters = {} } = usePage().props as any;
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
        router.get(route('inventory.customer-returns.index'), {
            page: 1,
            search: searchTerm || undefined,
            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        router.get(route('inventory.customer-returns.index'), {
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
            router.visit(route('inventory.customer-returns.show', item.id));
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedBranch('all');
        setShowFilters(false);

        router.get(route('inventory.customer-returns.index'), {
            page: 1,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Customer Returns') },
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
                <span className="font-mono text-sm">{value}</span>
            )
        },
        {
            key: 'branch',
            label: t('Branch'),
            render: (value: any) => value?.name || '—'
        },
        {
            key: 'customer',
            label: t('Customer'),
            render: (value: any) => (
                <div>
                    <div className="font-medium">{value?.name || '—'}</div>
                    {(value?.code || value?.phone) && (
                        <div className="text-xs text-gray-500">
                            {[value?.code, value?.phone].filter(Boolean).join(' · ')}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'sales_transaction',
            label: t('Sale Invoice'),
            render: (value: any, row: any) => (
                value?.sale_no?.trim() ? value.sale_no : (row.grn?.invoice_no?.trim() || '—')
            )
        },
        {
            key: 'return_date',
            label: t('Return Date'),
            sortable: true,
            render: (value: any) => value ? new Date(value).toLocaleDateString() : '—'
        },
        {
            key: 'invoice_return_credit',
            label: t('Stock In (Return)'),
            sortable: true,
            render: (value: any) => (
                <span className="text-emerald-800 tabular-nums">
                    {Number(value ?? 0).toFixed(2)}
                </span>
            )
        },
        {
            key: 'exchange_purchase_amount',
            label: t('Stock Out (Exchange)'),
            sortable: true,
            render: (value: any) => (
                <span className="text-red-700 tabular-nums">
                    {Number(value ?? 0).toFixed(2)}
                </span>
            )
        },
        {
            key: 'total_amount',
            label: t('Line Total'),
            sortable: true,
            render: (value: any) => (
                <span className="font-semibold text-green-600">
                    {formatMoney(Number(value))}
                </span>
            )
        },
        {
            key: 'customer_additional_payment_due',
            label: t('Customer Settlement'),
            render: (value: any, row: any) => {
                const due = Number(value ?? 0);
                const credit = Number(row.customer_credit_after_exchange ?? 0);

                if (due >= 0.005) {
                    return <span className="font-medium text-amber-900">{t('Due')} {formatMoney(due)}</span>;
                } else if (credit >= 0.005) {
                    return <span className="font-medium text-emerald-900">{t('Credit')} {formatMoney(credit)}</span>;
                } else {
                    return <span className="text-slate-400">—</span>;
                }
            }
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
            label: t('Add Customer Return'),
            icon: <Plus className="h-4 w-4 mr-2" />,
            variant: 'default' as const,
            onClick: () => router.visit(route('inventory.customer-returns.create')),
        },
    ];

    return (
        <PageTemplate
            title={t('Customer Returns')}
            description={t('Review customer returns matched to the sale invoice, including additional catalog lines when recorded.')}
            url="/inventory/customer-returns"
            breadcrumbs={breadcrumbs}
            actions={pageActions}
            noPadding
        >
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
                        router.get(route('inventory.customer-returns.index'), {
                            page: 1,
                            per_page: parseInt(value),
                            search: searchTerm || undefined,
                            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
                        }, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={customerReturns?.data || []}
                    from={customerReturns?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                />

                <Pagination
                    from={customerReturns?.from || 0}
                    to={customerReturns?.to || 0}
                    total={customerReturns?.total || 0}
                    links={customerReturns?.links}
                    entityName={t("customer returns")}
                    onPageChange={(url) => router.get(url)}
                />
            </div>
        </PageTemplate>
    );
}
