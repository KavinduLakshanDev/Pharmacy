import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';

export default function SupplierPaymentsIndex() {
    const { t } = useTranslation();
    const { payments = [], filters: pageFilters = {} } = usePage().props as any;

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = () => {
        return searchTerm !== '';
    };

    const activeFilterCount = () => {
        return searchTerm ? 1 : 0;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(route('inventory.supplier-payments.index'), {
            page: 1,
            search: searchTerm || undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        router.get(route('inventory.supplier-payments.index'), {
            sort_field: field,
            sort_direction: direction,
            page: 1,
            search: searchTerm || undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        if (action === 'view') {
            router.visit(route('inventory.supplier-payments.receipt', item.id));
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setShowFilters(false);

        router.get(route('inventory.supplier-payments.index'), {
            page: 1,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Supplier Payments') },
    ];

    const formatMoney = (value: number) => {
        const amount = Number.isFinite(value) ? value : 0;
        return window.appSettings?.formatCurrency?.(amount) || `Rs. ${amount.toFixed(2)}`;
    };

    const columns = [
        {
            key: 'id',
            label: t('Payment ID'),
            sortable: true,
            render: (value: any) => (
                <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-sm">SP-{value}</span>
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
            key: 'payment_method',
            label: t('Method'),
            sortable: true,
            render: (value: any) => (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {value}
                </span>
            )
        },
        {
            key: 'paid_amount',
            label: t('Amount'),
            sortable: true,
            render: (value: any) => (
                <span className="font-semibold text-green-600">
                    {formatMoney(Number(value))}
                </span>
            )
        },
        {
            key: 'payment_date',
            label: t('Date'),
            sortable: true,
            render: (value: any) => value ? new Date(value).toLocaleDateString() : '—'
        },
        {
            key: 'notes',
            label: t('Notes'),
            render: (value: any) => (
                <span className="text-sm text-gray-500 truncate max-w-[200px] block">
                    {value || '—'}
                </span>
            )
        },
    ];

    const actions = [
        {
            label: t('View Receipt'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
        },
    ];

    const pageActions = [
        {
            label: t('Record Payment'),
            icon: <Plus className="h-4 w-4 mr-2" />,
            variant: 'default' as const,
            onClick: () => router.visit(route('inventory.supplier-payments.create')),
        },
    ];

    return (
        <PageTemplate
            title={t('Supplier Payments')}
            description={t('Manage and record supplier payments')}
            url="/inventory/supplier-payments"
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
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={applyFilters}
                    currentPerPage={pageFilters.per_page?.toString() || "10"}
                    onPerPageChange={(value) => {
                        router.get(route('inventory.supplier-payments.index'), {
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
                    data={payments?.data || []}
                    from={payments?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                />

                {/* Pagination section */}
                <Pagination
                    from={payments?.from || 0}
                    to={payments?.to || 0}
                    total={payments?.total || 0}
                    links={payments?.links}
                    entityName={t("payments")}
                    onPageChange={(url) => router.get(url)}
                />
            </div>
        </PageTemplate>
    );
}
