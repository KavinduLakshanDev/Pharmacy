import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProductLookupPageProps {
    auth?: { permissions?: string[] };
    products?: Array<{
        id: number;
        name: string;
        sku?: string | null;
        description?: string | null;
        price?: number | null;
        category?: { name: string } | null;
        brand?: { name: string } | null;
        generic_name?: { name: string } | null;
        drug_form?: { name: string } | null;
        unit?: { name: string } | null;
    }>;
    filters?: {
        search?: string;
    };
}

export default function InventoryProductLookupPage() {
    const { t } = useTranslation();
    const { products = [], filters = {} } = usePage().props as unknown as ProductLookupPageProps;
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();

        router.get(
            route('inventory.product-lookup'),
            {
                search: searchTerm || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleView = (productId: number) => {
        router.visit(route('inventory.product-lookup.show', productId));
    };

    return (
        <PageTemplate
            title={t('Product Lookup')}
            description={t('Search inventory items then view details with Google and Wikipedia information.')}
            url="/inventory/product-lookup"
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Inventory'), href: route('inventory.dashboard') },
                { title: t('Product Lookup') },
            ]}
            noPadding
        >
            <div className="mx-auto max-w-5xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Search items')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SearchAndFilterBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onSearch={handleSearch}
                            showFilters={false}
                            setShowFilters={() => undefined}
                            hasActiveFilters={() => false}
                            activeFilterCount={() => 0}
                            onResetFilters={() => setSearchTerm('')}
                            currentPerPage=""
                            onPerPageChange={() => undefined}
                        />
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>{t('Results')}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Product')}</TableHead>
                                    <TableHead>{t('SKU')}</TableHead>
                                    <TableHead>{t('Brand')}</TableHead>
                                    <TableHead>{t('Category')}</TableHead>
                                    <TableHead>{t('Price')}</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                                            {t('No products found. Try a broader search term.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleView(product.id)}
                                        >
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{product.sku ?? '—'}</TableCell>
                                            <TableCell>{product.brand?.name ?? '—'}</TableCell>
                                            <TableCell>{product.category?.name ?? '—'}</TableCell>
                                            <TableCell>
                                                {product.price != null
                                                    ? (window.appSettings?.formatCurrency?.(Number(product.price)) ??
                                                      Number(product.price).toFixed(2))
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleView(product.id);
                                                    }}
                                                >
                                                    {t('View details')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
