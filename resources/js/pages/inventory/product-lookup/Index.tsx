import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';

export default function InventoryProductLookupPage() {
    const { t } = useTranslation();
    const { products = [], filters: pageFilters = {} } = usePage().props as any;

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
        router.get(route('inventory.product-lookup'), {
            page: 1,
            search: searchTerm || undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        router.get(route('inventory.product-lookup'), {
            sort_field: field,
            sort_direction: direction,
            page: 1,
            search: searchTerm || undefined,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        if (action === 'view') {
            router.visit(route('inventory.product-lookup.show', item.id));
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setShowFilters(false);

        router.get(route('inventory.product-lookup'), {
            page: 1,
            per_page: pageFilters.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Product Lookup') },
    ];

    const columns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                const mainImage = row.media?.find((m: any) => m.collection_name === 'main');
                const imageUrl = mainImage?.original_url || row.display_image_url || row.main_image_url || row.image;

                return (
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden p-1">
                            <img
                                src={imageUrl}
                                alt={row.name}
                                className="max-h-full max-w-full object-contain rounded-lg"
                                onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (!target.src.startsWith('data:image/svg+xml')) {
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTQwIDgwVjE0MEwxMDAgMTYwTDYwIDE0MFY4MEwxMDAgNjBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI4IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik03MCAxMzBMODUgMTE1TDEwMCAxMzBMMTMwIDEwMEwxMzAgMTMwSDcwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                                    } else {
                                        target.style.display = 'none';
                                        const icon = target.nextElementSibling as HTMLElement;
                                        if (icon) icon.style.display = 'flex';
                                    }
                                }}
                            />
                            <Package className="h-6 w-6 text-gray-400 hidden" />
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {row.sku}</div>
                            {row.barcode && (
                                <div className="text-xs text-gray-400">{t('Barcode')}: {row.barcode}</div>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'brand',
            label: t('Brand'),
            render: (value: any) => value?.name || '—'
        },
        {
            key: 'category',
            label: t('Category'),
            render: (value: any) => value?.name || '—'
        },
        {
            key: 'generic_name',
            label: t('Generic Name'),
            render: (value: any) => value?.name || '—'
        },
        {
            key: 'drug_form',
            label: t('Drug Form'),
            render: (value: any) => value?.name || '—'
        },
        {
            key: 'price',
            label: t('Price'),
            sortable: true,
            render: (value: any) => (
                <div className="font-semibold text-green-600">
                    {value != null
                        ? (window.appSettings?.formatCurrency?.(Number(value)) ??
                          Number(value).toFixed(2))
                        : '—'}
                </div>
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

    return (
        <PageTemplate
            title={t('Product Lookup')}
            description={t('Search inventory items then view details with Google and Wikipedia information.')}
            url="/inventory/product-lookup"
            breadcrumbs={breadcrumbs}
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
                        router.get(route('inventory.product-lookup'), {
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
                    data={products?.data || []}
                    from={products?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                />

                {/* Pagination section */}
                <Pagination
                    from={products?.from || 0}
                    to={products?.to || 0}
                    total={products?.total || 0}
                    links={products?.links}
                    entityName={t("products")}
                    onPageChange={(url) => router.get(url)}
                />
            </div>
        </PageTemplate>
    );
}
