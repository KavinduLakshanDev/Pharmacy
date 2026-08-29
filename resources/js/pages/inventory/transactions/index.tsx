import { CrudTable } from '@/components/CrudTable';
import { PageTemplate, type PageAction } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { showToast } from '@/components/ui/toast-notification';
import { SharedData } from '@/types';
import type { TableColumn } from '@/types/crud';
import { toEnumOptions } from '@/types/masterTransactionEnums';
import { router, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface InventoryTransactionsPageProps {
    auth?: SharedData['auth'] & { permissions?: string[] };
    masterTransactionEnums?: SharedData['masterTransactionEnums'];
    transactions: {
        data: Array<Record<string, unknown>>;
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    };
    filters?: Record<string, string>;
}

export default function InventoryTransactionsPage() {
    const { t } = useTranslation();
    const { auth, masterTransactionEnums, transactions, filters: pageFilters = {} } = usePage().props as unknown as InventoryTransactionsPageProps;

    const permissions = auth?.permissions ?? [];
    const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
    const [selectedTransactionType, setSelectedTransactionType] = useState(pageFilters.transaction_type ?? 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status ?? 'all');
    const [selectedSourceType, setSelectedSourceType] = useState(pageFilters.source_type ?? 'all');
    const [selectedStockType, setSelectedStockType] = useState(pageFilters.stock_type ?? 'all');
    const [showFilters, setShowFilters] = useState(false);

    const typeOptions = [{ value: 'all', label: t('All') }, ...toEnumOptions(masterTransactionEnums?.types ?? [])];
    const statusOptions = [{ value: 'all', label: t('All') }, ...toEnumOptions(masterTransactionEnums?.statuses ?? [])];
    const sourceOptions = [{ value: 'all', label: t('All') }, ...toEnumOptions(masterTransactionEnums?.sourceTypes ?? [])];
    const stockOptions = [{ value: 'all', label: t('All') }, ...toEnumOptions(masterTransactionEnums?.stockTypes ?? [])];

    const applyFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('inventory.transactions.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                transaction_type: selectedTransactionType !== 'all' ? selectedTransactionType : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                source_type: selectedSourceType !== 'all' ? selectedSourceType : undefined,
                stock_type: selectedStockType !== 'all' ? selectedStockType : undefined,
                per_page: pageFilters.per_page,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        applyFilters();
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        applyFilters({
            sort_field: field,
            sort_direction: direction,
        });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedTransactionType('all');
        setSelectedStatus('all');
        setSelectedSourceType('all');
        setSelectedStockType('all');
        setShowFilters(false);

        router.get(
            route('inventory.transactions.index'),
            {
                page: 1,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const hasActiveFilters = () => {
        return (
            Boolean(searchTerm) ||
            selectedTransactionType !== 'all' ||
            selectedStatus !== 'all' ||
            selectedSourceType !== 'all' ||
            selectedStockType !== 'all'
        );
    };

    const activeFilterCount = () => {
        return (
            Number(Boolean(searchTerm)) +
            Number(selectedTransactionType !== 'all') +
            Number(selectedStatus !== 'all') +
            Number(selectedSourceType !== 'all') +
            Number(selectedStockType !== 'all')
        );
    };

    const columns: TableColumn[] = [
        { key: 'reference_number', label: t('Reference'), sortable: true },
        {
            key: 'product.name',
            label: t('Product'),
            render: (value: unknown, row: Record<string, unknown>) => {
                const product = row.product as { sku?: string } | undefined;
                const sku = product?.sku ? ` (${product.sku})` : '';

                return typeof value === 'string' && value.length > 0 ? `${value}${sku}` : t('-');
            },
        },
        {
            key: 'transaction_type',
            label: t('Type'),
            sortable: true,
            render: (value: unknown) => {
                const text = typeof value === 'string' ? value : '-';
                const classes = text === 'IN' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20';

                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}>{text}</span>
                );
            },
        },
        {
            key: 'status',
            label: t('Status'),
            sortable: true,
            render: (value: unknown) => {
                const text = typeof value === 'string' ? value : '-';
                const classes =
                    text === 'completed'
                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                        : text === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                          : 'bg-red-50 text-red-700 ring-red-600/20';

                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset ${classes}`}>
                        {text}
                    </span>
                );
            },
        },
        { 
            key: 'quantity', 
            label: t('Quantity'), 
            sortable: true, 
            render: (value: unknown, row: Record<string, unknown>) => {
                const packSize = Number(row.pack_size) || 1;
                const units = Number(value ?? 0) * packSize;
                return units.toFixed(2);
            }
        },
        {
            key: 'unit_price',
            label: t('Unit Price'),
            sortable: true,
            render: (value: unknown) => window.appSettings?.formatCurrency?.(Number(value ?? 0)) ?? Number(value ?? 0).toFixed(2),
        },
        {
            key: 'total_amount',
            label: t('Line Total'),
            sortable: true,
            render: (value: unknown) => window.appSettings?.formatCurrency?.(Number(value ?? 0)) ?? Number(value ?? 0).toFixed(2),
        },
        {
            key: 'transaction_date',
            label: t('Date'),
            sortable: true,
            render: (value: unknown) => {
                if (typeof value !== 'string' || value.length === 0) {
                    return t('-');
                }

                return window.appSettings?.formatDateTime?.(value, false) ?? new Date(value).toLocaleString();
            },
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.transactions.index') },
        { title: t('Transactions') },
    ];

    const pageActions: PageAction[] = [
        {
            label: t('Placeholder.Print'),
            icon: <Printer className="mr-2 h-4 w-4" />,
            variant: 'ghost',
            onClick: () => showToast(t('Print functionality is not implemented yet.'), 'info'),
        },
    ];

    return (
        <PageTemplate
            title={t('Inventory Transactions')}
            description={t('Monitor stock movements across inventory transactions.')}
            url="/inventory/transactions"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="space-y-4">
                <div className="rounded-lg bg-white shadow dark:bg-gray-900">
                    <div className="p-4">
                        <SearchAndFilterBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onSearch={handleSearch}
                            filters={[
                                {
                                    name: 'transaction_type',
                                    label: t('Type'),
                                    type: 'select',
                                    options: typeOptions,
                                    value: selectedTransactionType,
                                    onChange: setSelectedTransactionType,
                                },
                                {
                                    name: 'status',
                                    label: t('Status'),
                                    type: 'select',
                                    options: statusOptions,
                                    value: selectedStatus,
                                    onChange: setSelectedStatus,
                                },
                                {
                                    name: 'source_type',
                                    label: t('Source'),
                                    type: 'select',
                                    options: sourceOptions,
                                    value: selectedSourceType,
                                    onChange: setSelectedSourceType,
                                },
                                {
                                    name: 'stock_type',
                                    label: t('Stock Location'),
                                    type: 'select',
                                    options: stockOptions,
                                    value: selectedStockType,
                                    onChange: setSelectedStockType,
                                },
                            ]}
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                            hasActiveFilters={hasActiveFilters}
                            activeFilterCount={activeFilterCount}
                            onResetFilters={handleResetFilters}
                            onApplyFilters={() => applyFilters()}
                            currentPerPage={String(pageFilters.per_page ?? '10')}
                            onPerPageChange={(value) => applyFilters({ per_page: Number(value) })}
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <CrudTable
                        columns={columns}
                        actions={[]}
                        data={transactions.data}
                        from={transactions.from ?? 1}
                        onAction={() => {}}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction as 'asc' | 'desc' | undefined}
                        onSort={handleSort}
                        permissions={permissions}
                    />
                    <Pagination
                        from={transactions.from}
                        to={transactions.to}
                        total={transactions.total}
                        links={transactions.links}
                        currentPage={transactions.current_page}
                        lastPage={transactions.last_page}
                        entityName={t('transactions')}
                        onPageChange={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
                    />
                </div>
            </div>
        </PageTemplate>
    );
}
