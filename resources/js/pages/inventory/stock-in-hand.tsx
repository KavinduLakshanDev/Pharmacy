import { CrudTable } from '@/components/CrudTable';
import { PageAction, PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { showToast } from '@/components/ui/toast-notification';
import { SharedData } from '@/types';
import type { TableColumn } from '@/types/crud';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface StockInHandPageProps {
    auth?: SharedData['auth'] & { permissions?: string[] };
    stockInHand: {
        data: Array<Record<string, unknown>>;
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    };
    branches?: Array<{ id: number; name: string }>;
    batchNos?: string[];
    filters?: Record<string, string>;
}

export default function StockInHandPage() {
    const { t } = useTranslation();
    const { auth, stockInHand, branches = [], batchNos = [], filters: pageFilters = {} } = usePage().props as unknown as StockInHandPageProps;

    const permissions = auth?.permissions ?? [];
    const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
    const [branchId, setBranchId] = useState(pageFilters.branch_id ?? 'all');
    const [batchNo, setBatchNo] = useState(pageFilters.batch_no ?? 'all');
    const [expiryStatus, setExpiryStatus] = useState(pageFilters.expiry_status ?? 'all');
    const [perPage, setPerPage] = useState(pageFilters.per_page ?? '15');
    const [showFilters, setShowFilters] = useState(false);

    const branchOptions = [{ value: 'all', label: t('All Branches') }, ...branches.map((branch) => ({ value: String(branch.id), label: branch.name }))];
    const batchOptions = [
        { value: 'all', label: t('All Batches') },
        ...batchNos
            .filter((batch) => batch.trim().length > 0)
            .map((batch) => ({ value: batch, label: batch })),
    ];

    const expiryOptions = [
        { value: 'all', label: t('All Expiry Statuses') },
        { value: 'expired', label: t('Expired') },
        { value: 'short_expiry', label: t('Short Expiry') },
        { value: 'long_expiry', label: t('Long Expiry') },
    ];

    const applyFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('inventory.stock-in-hand'),
            {
                page: 1,
                search: searchTerm || undefined,
                branch_id: branchId !== 'all' ? branchId : undefined,
                batch_no: batchNo !== 'all' ? batchNo : undefined,
                expiry_status: expiryStatus !== 'all' ? expiryStatus : undefined,
                per_page: perPage,
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
        setBranchId('all');
        setBatchNo('all');
        setExpiryStatus('all');
        setShowFilters(false);

        router.get(
            route('inventory.stock-in-hand'),
            {
                page: 1,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const hasActiveFilters = () => {
        return Boolean(searchTerm) || branchId !== 'all' || batchNo !== 'all' || expiryStatus !== 'all';
    };

    const activeFilterCount = () => {
        return Number(Boolean(searchTerm)) + Number(branchId !== 'all') + Number(batchNo !== 'all') + Number(expiryStatus !== 'all');
    };

    const handleAction = (action: string, item: Record<string, unknown>) => {
        if (action === 'view') {
            const product = item.product as { id?: number } | undefined;
            router.get(route('stock-in-hand.index'), { product_id: product?.id });
        }
    };

    const columns: TableColumn[] = [
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
            key: 'current_stock',
            label: t('Stock In Hand'),
            sortable: true,
            render: (_value: unknown, row: Record<string, unknown>) => {
                const units = row.units_in_hand != null ? Number(row.units_in_hand) : Number(row.current_stock);
                const isLow = units <= 0;
                return <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{units}</span>;
            },
        },
        {
            key: 'transaction_date',
            label: t('Last Activity'),
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
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Stock In Hand') },
    ];

    const pageActions: PageAction[] = [
        {
            label: t('Back'),
            icon: <ArrowLeft className="mr-2 h-4 w-4" />,
            variant: 'outline',
            onClick: () => router.get(route('inventory.dashboard')),
        },
        {
            label: t('Placeholder.Print'),
            icon: <Printer className="mr-2 h-4 w-4" />,
            variant: 'ghost',
            onClick: () => showToast(t('Print functionality is not implemented yet.'), 'info'),
        },
    ];

    return (
        <PageTemplate
            title={t('Stock In Hand')}
            description={t('View current stock levels based on master transactions.')}
            url="/inventory/stock-in-hand"
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
                            onApplyFilters={() => applyFilters()}
                            filters={[
                                {
                                    name: 'branch_id',
                                    label: t('Branch'),
                                    type: 'select',
                                    options: branchOptions,
                                    value: branchId,
                                    onChange: setBranchId,
                                },
                                {
                                    name: 'batch_no',
                                    label: t('Batch'),
                                    type: 'select',
                                    options: batchOptions,
                                    value: batchNo,
                                    onChange: setBatchNo,
                                },
                                {
                                    name: 'expiry_status',
                                    label: t('Expiry Status'),
                                    type: 'select',
                                    options: expiryOptions,
                                    value: expiryStatus,
                                    onChange: setExpiryStatus,
                                },
                            ]}
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                            hasActiveFilters={hasActiveFilters}
                            activeFilterCount={activeFilterCount}
                            onResetFilters={handleResetFilters}
                            currentPerPage={perPage}
                            onPerPageChange={(value) => {
                                setPerPage(value);
                                applyFilters({ per_page: value });
                            }}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <CrudTable
                            columns={columns}
                            actions={[{ action: 'view', label: t('View Batches'), icon: 'Eye', requiredPermission: 'manage-inventory' }]}
                            data={stockInHand.data}
                            from={stockInHand.from ?? 1}
                            onAction={handleAction}
                            sortField={pageFilters.sort_field}
                            sortDirection={pageFilters.sort_direction as 'asc' | 'desc' | undefined}
                            onSort={handleSort}
                            permissions={permissions}
                        />
                    </div>

                    <div className="p-4">
                        <Pagination links={stockInHand.links ?? []} />
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
