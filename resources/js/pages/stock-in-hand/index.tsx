import { CrudTable } from '@/components/CrudTable';
import { PageAction, PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import type { TableAction, TableColumn } from '@/types/crud';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Must match `StockInHandController::EMPTY_BATCH_URL_SEGMENT` (route batch requires [^/]+). */
const STOCK_IN_HAND_EMPTY_BATCH_SEGMENT = '__EMPTY_BATCH__';

function batchSegmentForStockInHandRoute(batchNo: unknown): string {
    const s = batchNo == null ? '' : String(batchNo);

    return s === '' ? STOCK_IN_HAND_EMPTY_BATCH_SEGMENT : s;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface StockRow {
    product_id: number;
    product_name: string;
    product_sku: string;
    batch_no: string;
    pack_size: string | null;
    qty_in: number;
    qty_out: number;
    stock_in_hand: number;
    cost_price: number | null;
    sale_price: number | null;
    unit_cost_price: number | null;
}

interface StockInHandIndexProps {
    stockRows: {
        data: StockRow[];
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    };
    products: Array<{ id: number; name: string; sku: string }>;
    branches: Array<{ id: number; name: string }>;
    batchNos: string[];
    filters?: Record<string, string>;
}

export default function StockInHandIndex() {
    const { t } = useTranslation();
    const { stockRows, products = [], branches = [], batchNos = [], filters: pageFilters = {} } =
        usePage().props as unknown as StockInHandIndexProps;

    const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
    const [productId, setProductId] = useState(pageFilters.product_id ?? 'all');
    const [branchId, setBranchId] = useState(pageFilters.branch_id ?? 'all');
    const [batchNo, setBatchNo] = useState(pageFilters.batch_no ?? 'all');
    const [expiryStatus, setExpiryStatus] = useState(pageFilters.expiry_status ?? 'all');
    const [perPage, setPerPage] = useState(pageFilters.per_page ?? '15');
    const [showFilters, setShowFilters] = useState(false);

    const productOptions = [
        { value: 'all', label: t('All Products') },
        ...products.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku})` })),
    ];

    const branchOptions = [
        { value: 'all', label: t('All Branches') },
        ...branches.map((b) => ({ value: String(b.id), label: b.name })),
    ];

    const batchOptions = [
        { value: 'all', label: t('All Batches') },
        ...batchNos.map((batch) => ({ value: batch, label: batch })),
    ];

    const expiryOptions = [
        { value: 'all', label: t('All Expiry Statuses') },
        { value: 'expired', label: t('Expired') },
        { value: 'short_expiry', label: t('Short Expiry') },
        { value: 'long_expiry', label: t('Long Expiry') },
    ];

    const applyFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('stock-in-hand.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                product_id: productId !== 'all' ? productId : undefined,
                branch_id: branchId !== 'all' ? branchId : undefined,
                batch_no: batchNo !== 'all' ? batchNo : undefined,
                expiry_status: expiryStatus !== 'all' ? expiryStatus : undefined,
                per_page: perPage,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleReset = () => {
        setSearchTerm('');
        setProductId('all');
        setBranchId('all');
        setBatchNo('all');
        setExpiryStatus('all');
        setShowFilters(false);
        router.get(route('stock-in-hand.index'), { page: 1, per_page: pageFilters.per_page }, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = () => Boolean(searchTerm) || productId !== 'all' || branchId !== 'all' || batchNo !== 'all' || expiryStatus !== 'all';

    const activeFilterCount = () =>
        Number(Boolean(searchTerm)) + Number(productId !== 'all') + Number(branchId !== 'all') + Number(batchNo !== 'all') + Number(expiryStatus !== 'all');

    const handleAction = (action: string, row: Record<string, unknown>) => {
        if (action === 'view') {
            router.get(
                route('stock-in-hand.show', {
                    productId: row.product_id,
                    batch: batchSegmentForStockInHandRoute(row.batch_no),
                }),
                branchId !== 'all' ? { branch_id: branchId } : {},
            );
        }
    };

    const columns: TableColumn[] = [
        {
            key: 'product_name',
            label: t('Product'),
            sortable: true,
            render: (value: unknown, row: Record<string, unknown>) =>
                `${value}${row.product_sku ? ` (${row.product_sku})` : ''}`,
        },
        {
            key: 'batch_no',
            label: t('Batch No'),
            render: (value: unknown) => {
                const label = value === '' || value == null ? '—' : String(value);

                return (
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                        {label}
                    </span>
                );
            },
        },
        {
            key: 'cost_price',
            label: t('Cost Price'),
            render: (value: unknown) =>
                value != null ? (window.appSettings?.formatCurrency?.(Number(value)) ?? Number(value).toFixed(2)) : '-',
        },
        {
            key: 'sale_price',
            label: t('Sale Price'),
            render: (value: unknown) =>
                value != null ? (window.appSettings?.formatCurrency?.(Number(value)) ?? Number(value).toFixed(2)) : '-',
        },
        {
            key: 'unit_cost_price',
            label: t('Unit Cost Price'),
            render: (_value: unknown, row: Record<string, unknown>) => {
                const unitCostPrice = row.unit_cost_price as number | null;
                if (unitCostPrice != null) {
                    return window.appSettings?.formatCurrency?.(unitCostPrice) ?? unitCostPrice.toFixed(4);
                }
                const costPrice = row.cost_price as number | null;
                if (costPrice == null) return '-';
                const packSize = Number(row.pack_size) || 1;
                const unitCost = costPrice / packSize;
                return window.appSettings?.formatCurrency?.(unitCost) ?? unitCost.toFixed(4);
            },
        },
        {
            key: 'qty_in',
            label: t('Qty In'),
            render: (value: unknown, row: Record<string, unknown>) => {
                const packSize = Number(row.pack_size) || null;
                const units = packSize ? Number(value) * packSize : Number(value);
                return <span className="font-medium text-green-700">{units}</span>;
            },
        },
        {
            key: 'qty_out',
            label: t('Qty Out'),
            render: (value: unknown, row: Record<string, unknown>) => {
                const packSize = Number(row.pack_size) || null;
                const units = packSize ? Number(value) * packSize : Number(value);
                return <span className="font-medium text-red-600">{units}</span>;
            },
        },
        {
            key: 'stock_in_hand',
            label: t('Stock In Hand'),
            render: (value: unknown, row: Record<string, unknown>) => {
                const packSize = Number(row.pack_size) || null;
                const units = packSize ? Number(value) * packSize : Number(value);
                const isLow = units <= 0;
                return <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{units}</span>;
            },
        },
    ];

    const actions: TableAction[] = [
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Stock In Hand') },
    ];

    const pageActions: PageAction[] = [
        {
            label: t('Back'),
            icon: <ArrowLeft className="mr-2 h-4 w-4" />,
            variant: 'outline',
            onClick: () => router.get(route('dashboard')),
        },
    ];

    return (
        <PageTemplate
            title={t('Stock In Hand')}
            description={t('Batch-wise stock available in hand')}
            url="/stock-in-hand"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    onApplyFilters={applyFilters}
                    filters={[
                        {
                            name: 'product_id',
                            label: t('Product'),
                            type: 'select',
                            options: productOptions,
                            value: productId,
                            onChange: (v) => setProductId(typeof v === 'string' ? v : 'all'),
                        },
                        {
                            name: 'branch_id',
                            label: t('Branch'),
                            type: 'select',
                            options: branchOptions,
                            value: branchId,
                            onChange: (v) => setBranchId(typeof v === 'string' ? v : 'all'),
                        },
                        {
                            name: 'batch_no',
                            label: t('Batch'),
                            type: 'select',
                            options: batchOptions,
                            value: batchNo,
                            onChange: (v) => setBatchNo(typeof v === 'string' ? v : 'all'),
                        },
                        {
                            name: 'expiry_status',
                            label: t('Expiry Status'),
                            type: 'select',
                            options: expiryOptions,
                            value: expiryStatus,
                            onChange: (v) => setExpiryStatus(typeof v === 'string' ? v : 'all'),
                        },
                    ]}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleReset}
                    currentPerPage={perPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        applyFilters({ per_page: value });
                    }}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={stockRows.data as unknown as Record<string, unknown>[]}
                    from={stockRows.from ?? 1}
                    onAction={handleAction}
                    permissions={[]}
                />
                <Pagination
                    links={stockRows.links ?? []}
                    from={stockRows.from}
                    to={stockRows.to}
                    total={stockRows.total}
                />
            </div>
        </PageTemplate>
    );
}
