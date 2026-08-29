import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';

export default function DrugDestroysPage() {
    const { t } = useTranslation();
    const { auth, stockRows = [], branches = [], filters: pageFilters = {} } = usePage().props as any;
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
        router.get(route('inventory.drug-destroys.index'), {
            page: 1,
            search: searchTerm || undefined,
            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        router.get(route('inventory.drug-destroys.index'), {
            sort_field: field,
            sort_direction: direction,
            page: 1,
            search: searchTerm || undefined,
            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedBranch('all');
        setShowFilters(false);

        router.get(route('inventory.drug-destroys.index'), {
            page: 1,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const navigateToSupplierReturn = (row: any) => {
        const query = new URLSearchParams();
        const branchId = row.branch_id ?? (pageFilters.branch_id && pageFilters.branch_id !== 'all' ? Number(pageFilters.branch_id) : null);

        if (branchId !== null) {
            query.set('branch_id', String(branchId));
        }
        query.set('product_id', String(row.product_id));
        query.set('batch_no', row.batch_no || '');

        router.visit(`${route('inventory.supplier-returns.create')}?${query.toString()}`);
    };

    const destroyStock = (row: any) => {
        if (Number(row.stock_in_hand) <= 0) {
            return;
        }

        if (!window.confirm(t('Are you sure you want to destroy this stock? This action cannot be undone.'))) {
            return;
        }

        const destroyDate = new Date().toISOString().split('T')[0];

        router.post(route('inventory.drug-destroys.store'), {
            ...(row.branch_id ? { branch_id: row.branch_id } : (pageFilters.branch_id && pageFilters.branch_id !== 'all' ? { branch_id: pageFilters.branch_id } : {})),
            destroy_date: destroyDate,
            notes: 'Expired stock destruction',
            items: [
                {
                    product_id: row.product_id,
                    batch_no: row.batch_no || null,
                    expiry_date: row.expiry_date || null,
                    quantity: Number(row.stock_in_hand),
                    unit_price: Number(row.unit_cost_price ?? 0),
                },
            ],
        });
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Drug Destroys') },
    ];

    const formatMoney = (value: number) => {
        const amount = Number.isFinite(value) ? value : 0;
        return window.appSettings?.formatCurrency?.(amount) || `Rs. ${amount.toFixed(2)}`;
    };

    const columns = [
        {
            key: 'product_name',
            label: t('Product'),
            sortable: true,
            render: (value: any, row: any) => (
                <div>
                    <div className="font-medium">{value}</div>
                    <div className="text-xs text-gray-500">SKU: {row.product_sku}</div>
                </div>
            )
        },
        {
            key: 'batch_no',
            label: t('Batch'),
            render: (value: any) => value || t('No batch')
        },
        {
            key: 'expiry_date',
            label: t('Expiry Date'),
            sortable: true,
            render: (value: any) => value ?? t('Unknown')
        },
        {
            key: 'stock_in_hand',
            label: t('Quantity'),
            sortable: true,
            render: (value: any) => (
                <span className="tabular-nums">{Number(value ?? 0).toFixed(2)}</span>
            )
        },
        {
            key: 'supplier_return_count',
            label: t('Supplier Return'),
            render: (value: any) => (
                Number(value) > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {t('Returned')}
                    </span>
                ) : (
                    <span className="text-xs text-gray-500">{t('Not returned')}</span>
                )
            )
        },
        {
            key: 'latest_return_date',
            label: t('Last Return Date'),
            render: (value: any) => value ?? '—'
        },
        {
            key: 'unit_cost_price',
            label: t('Unit Cost'),
            render: (value: any) => formatMoney(Number(value ?? 0))
        },
        {
            key: 'actions',
            label: t('Actions'),
            render: (_: any, row: any) => {
                if (Number(row.supplier_return_count) > 0) {
                    return (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {t('Already returned')}
                        </span>
                    );
                }
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigateToSupplierReturn(row)}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {t('Create Return')}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => destroyStock(row)}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t('Destroy')}
                        </Button>
                    </div>
                );
            }
        },
    ];

    const branchOptions = [
        { value: 'all', label: t('All Branches') },
        ...(branches || []).map((branch: any) => ({
            value: branch.id.toString(),
            label: branch.name
        }))
    ];

    return (
        <PageTemplate
            title={t('Drug Destroys')}
            description={t('Review expiring stock and destroy items that have not been returned to the supplier.')}
            url="/inventory/drug-destroys"
            breadcrumbs={breadcrumbs}
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
                        router.get(route('inventory.drug-destroys.index'), {
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
                    actions={[]}
                    data={stockRows?.data || []}
                    from={stockRows?.from || 1}
                    onAction={() => {}}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                />

                <Pagination
                    from={stockRows?.from || 0}
                    to={stockRows?.to || 0}
                    total={stockRows?.total || 0}
                    links={stockRows?.links}
                    entityName={t("expiring drugs")}
                    onPageChange={(url) => router.get(url)}
                />
            </div>
        </PageTemplate>
    );
}
