import { PageTemplate, type PageAction } from '@/components/page-template';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import SearchableSelect from '@/components/ui/searchable-select';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { showToast } from '@/components/ui/toast-notification';
import { router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Printer, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Transaction {
    id: number;
    reference_number: string;
    transaction_type: string;
    transactionable_type: string | null;
    quantity: string | number;
    /** Pack-level quantity from DB (e.g. boxes). */
    quantity_units?: string | number;
    unit_price: string | number;
    /** Per smallest unit (e.g. tablet), derived using pack size from GRN or product. */
    unit_price_per_unit?: string | number;
    pack_size?: string | number;
    total_amount: string | number;
    previous_stock: string | number;
    current_stock: string | number;
    transaction_date: string;
    notes: string | null;
    creator?: { name: string };
}

interface SelectedProduct {
    id: number;
    name: string;
    sku?: string;
    stock_quantity?: string | number;
    pack_size?: string | number | null;
    unit?: { name: string };
    product_type?: string;
}

function filterPropString(value: unknown, fallback: string): string {
    if (value === null || value === undefined) {
        return fallback;
    }

    return String(value);
}

interface StockBinCardPageProps {
    auth?: { permissions?: string[] };
    products: Array<{ id: number; name: string; sku?: string; stock_quantity?: string | number; unit?: { name: string }; product_type?: string }>;
    selectedProduct: SelectedProduct | null;
    openingBalance: number;
    currentStock: number;
    transactions: {
        data: Transaction[];
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    } | null;
    branches: Array<{ id: number; name: string }>;
    filters?: Record<string, string | number | undefined>;
    searchProductNotFound?: boolean;
}

export default function StockBinCardPage() {
    const { t } = useTranslation();
    const {
        products = [],
        selectedProduct,
        openingBalance,
        currentStock = 0,
        transactions,
        branches = [],
        filters: pageFilters = {},
        searchProductNotFound = false,
    } = usePage().props as unknown as StockBinCardPageProps;

    const [searchTerm, setSearchTerm] = useState<string>(() =>
        filterPropString(pageFilters.search, ''),
    );
    const [selectedProductId, setSelectedProductId] = useState<string>(() =>
        pageFilters.product_id != null && String(pageFilters.product_id) !== ''
            ? String(pageFilters.product_id)
            : 'all',
    );
    const [selectedBranchId, setSelectedBranchId] = useState<string>(() =>
        pageFilters.branch_id != null && String(pageFilters.branch_id) !== ''
            ? String(pageFilters.branch_id)
            : 'all',
    );
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        pageFilters.date_from ? new Date(`${pageFilters.date_from}T00:00:00`) : undefined,
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        pageFilters.date_to ? new Date(`${pageFilters.date_to}T00:00:00`) : undefined,
    );
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const id = pageFilters.product_id;
        setSelectedProductId(id != null && String(id) !== '' ? String(id) : 'all');
        setSearchTerm(filterPropString(pageFilters.search, ''));
        setSelectedBranchId(
            pageFilters.branch_id != null && String(pageFilters.branch_id) !== ''
                ? String(pageFilters.branch_id)
                : 'all',
        );
        setDateFrom(
            pageFilters.date_from ? new Date(`${String(pageFilters.date_from)}T00:00:00`) : undefined,
        );
        setDateTo(
            pageFilters.date_to ? new Date(`${String(pageFilters.date_to)}T00:00:00`) : undefined,
        );
    }, [
        pageFilters.product_id,
        pageFilters.search,
        pageFilters.branch_id,
        pageFilters.date_from,
        pageFilters.date_to,
    ]);

    useEffect(() => {
        if (searchProductNotFound) {
            showToast(t('No product matched your search.'), 'info');
        }
    }, [searchProductNotFound, t]);

    const formatFilterDate = (date: Date | undefined): string | undefined => {
        if (!date || Number.isNaN(date.getTime())) {
            return undefined;
        }

        return format(date, 'yyyy-MM-dd');
    };

    const productOptions = products.map((product) => ({
        value: String(product.id),
        label: product.sku ? `${product.name} (${product.sku})` : product.name,
    }));

    const branchOptions = [
        { value: 'all', label: t('All Branches') },
        ...branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
    ];

    const applyFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('inventory.stock-bin-card'),
            {
                page: 1,
                search: searchTerm || undefined,
                product_id: selectedProductId !== 'all' ? selectedProductId : undefined,
                branch_id: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : undefined,
                date_from: formatFilterDate(dateFrom),
                date_to: formatFilterDate(dateTo),
                per_page: pageFilters.per_page,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const term = searchTerm.trim();
        router.get(
            route('inventory.stock-bin-card'),
            {
                page: 1,
                search: term || undefined,
                product_id: selectedProductId !== 'all' ? selectedProductId : undefined,
                branch_id: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : undefined,
                date_from: formatFilterDate(dateFrom),
                date_to: formatFilterDate(dateTo),
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Stock Bin Card') },
    ];

    const pageActions: PageAction[] = [
        {
            label: t('Print'),
            icon: <Printer className="mr-2 h-4 w-4" />,
            variant: 'ghost',
            onClick: () => showToast(t('Print functionality is not implemented yet.'), 'info'),
        },
    ];

    const currentStockValue = Number(currentStock ?? 0);
    const unitLabel = selectedProduct?.unit?.name?.trim() ? selectedProduct.unit.name : t('units');

    return (
        <PageTemplate
            title={t('Stock Bin Card')}
            description={t('View detailed stock movement ledger for a specific product.')}
            url="/stock-bin-card"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="space-y-4">
                {/* Filter bar */}
                <div className="rounded-lg bg-white shadow dark:bg-gray-900">
                    <div className="p-4">
                        <SearchAndFilterBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onSearch={handleSearch}
                            beforeFilters={(
                                <div className="space-y-2 w-[280px] min-w-[280px]">
                                    <Label>{t('Product')}</Label>
                                    <SearchableSelect
                                        value={selectedProductId}
                                        onValueChange={(value) => setSelectedProductId(value)}
                                        options={[{ value: 'all', label: t('All Products') }, ...productOptions]}
                                        placeholder={t('Select product')}
                                        noOptionsText={t('No products found')}
                                    />
                                </div>
                            )}
                            filters={[{
                                    name: 'branch_id',
                                    label: t('Branch'),
                                    type: 'select',
                                    options: branchOptions,
                                    value: selectedBranchId,
                                    onChange: setSelectedBranchId,
                                },
                                {
                                    name: 'date_from',
                                    label: t('From Date'),
                                    type: 'date',
                                    value: dateFrom,
                                    onChange: setDateFrom,
                                },
                                {
                                    name: 'date_to',
                                    label: t('To Date'),
                                    type: 'date',
                                    value: dateTo,
                                    onChange: setDateTo,
                                },
                            ]}
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                            hasActiveFilters={() =>
                                Boolean(searchTerm) ||
                                selectedProductId !== 'all' ||
                                selectedBranchId !== 'all' ||
                                Boolean(dateFrom) ||
                                Boolean(dateTo)
                            }
                            activeFilterCount={() =>
                                Number(Boolean(searchTerm)) +
                                Number(selectedProductId !== 'all') +
                                Number(selectedBranchId !== 'all') +
                                Number(Boolean(dateFrom)) +
                                Number(Boolean(dateTo))
                            }
                            onResetFilters={() => {
                                setSearchTerm('');
                                setSelectedProductId('all');
                                setSelectedBranchId('all');
                                setDateFrom(undefined);
                                setDateTo(undefined);
                                setShowFilters(false);
                                router.get(route('inventory.stock-bin-card'), {}, { preserveState: false });
                            }}
                            onApplyFilters={() => applyFilters()}
                            currentPerPage={String(pageFilters.per_page ?? '15')}
                            onPerPageChange={(value) => applyFilters({ per_page: Number(value) })}
                        />
                    </div>
                </div>

                {/* Product summary card */}
                {selectedProduct && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                    {selectedProduct.name}
                                </h3>
                                {selectedProduct.sku && (
                                    <p className="text-sm text-blue-600 dark:text-blue-300">
                                        {t('SKU')}: {selectedProduct.sku}
                                    </p>
                                )}
                                <p className="mt-2 max-w-xl text-xs text-blue-700/90 dark:text-blue-200/90">
                                    {t(
                                        'Quantities, balances and unit prices are shown in base units (:unit). Pack size is taken from the GRN line for each batch when available, otherwise from the product.',
                                        { unit: unitLabel },
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-6 text-center">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-300">
                                        {t('Opening Balance')} ({unitLabel})
                                    </p>
                                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                        {Number(openingBalance).toFixed(2)}
                                    </p>
                                </div>
                                <div className="border-l border-blue-300 pl-6 dark:border-blue-700">
                                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-300">
                                        {t('Current Stock')} ({unitLabel})
                                    </p>
                                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                        {currentStockValue.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bin card table */}
                {selectedProduct && transactions ? (
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('#')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('Date')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('Reference')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('Source')}
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-emerald-600">
                                            {t('IN')} ({unitLabel})
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-amber-600">
                                            {t('OUT')} ({unitLabel})
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('Unit Price')} ({unitLabel})
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('Line Total')}
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-blue-600">
                                            {t('Balance')} ({unitLabel})
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('Created By')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {/* Opening balance row */}
                                    {(transactions.from ?? 1) === 1 && (
                                        <tr className="bg-blue-50 dark:bg-blue-950/40">
                                            <td className="px-4 py-2 text-gray-400" />
                                            <td className="px-4 py-2" />
                                            <td className="px-4 py-2 font-medium text-blue-700 dark:text-blue-300" colSpan={6}>
                                                {t('Opening Balance')}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-blue-700 dark:text-blue-300">
                                                {Number(openingBalance).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2" />
                                        </tr>
                                    )}

                                    {transactions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                                                {t('No stock movements found.')}
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.data.map((txn, idx) => {
                                            const isIn = txn.transaction_type === 'IN';
                                            const qtyUnits =
                                                txn.quantity_units !== undefined && txn.quantity_units !== null
                                                    ? Number(txn.quantity_units)
                                                    : Number(txn.quantity ?? 0);
                                            const unitPriceEach =
                                                txn.unit_price_per_unit !== undefined && txn.unit_price_per_unit !== null
                                                    ? Number(txn.unit_price_per_unit)
                                                    : Number(txn.unit_price ?? 0);
                                            const source = txn.transactionable_type
                                                ? txn.transactionable_type
                                                    .replace(/_/g, ' ')
                                                    .replace(/\b\w/g, (c) => c.toUpperCase())
                                                : t('-');

                                            return (
                                                <tr
                                                    key={txn.id}
                                                    className={
                                                        idx % 2 === 0
                                                            ? 'bg-white dark:bg-gray-900'
                                                            : 'bg-gray-50 dark:bg-gray-800/50'
                                                    }
                                                >
                                                    <td className="px-4 py-2 text-gray-400">
                                                        {(transactions.from ?? 1) + idx}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                                                        {window.appSettings?.formatDateTime?.(txn.transaction_date, false) ??
                                                            new Date(txn.transaction_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-xs text-gray-800 dark:text-gray-200">
                                                        {txn.reference_number}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                                        {source}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium text-emerald-700 dark:text-emerald-400">
                                                        {isIn ? qtyUnits.toFixed(2) : ''}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium text-amber-700 dark:text-amber-400">
                                                        {isIn ? '' : qtyUnits.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">
                                                        {window.appSettings?.formatCurrency?.(unitPriceEach) ??
                                                            unitPriceEach.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">
                                                        {window.appSettings?.formatCurrency?.(Number(txn.total_amount ?? 0)) ??
                                                            Number(txn.total_amount ?? 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-semibold text-blue-700 dark:text-blue-300">
                                                        {Number(txn.current_stock ?? 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                                        {txn.creator?.name ?? t('-')}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4">
                            <Pagination
                                from={transactions.from}
                                to={transactions.to}
                                total={transactions.total}
                                links={transactions.links}
                                currentPage={transactions.current_page}
                                lastPage={transactions.last_page}
                                entityName={t('movements')}
                                onPageChange={(url) => router.visit(url, { preserveState: true, preserveScroll: true })}
                            />
                        </div>
                    </div>
                ) : (
                    !selectedProduct && (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900">
                            <Package className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                            <p className="font-medium text-gray-500 dark:text-gray-400">{t('Select a product to view its bin card.')}</p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                {t('Choose a product in filters, then click Apply Filters.')}
                            </p>
                        </div>
                    )
                )}
            </div>
        </PageTemplate>
    );
}
