import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface Branch {
    id: number;
    name: string;
}

interface PriceDetail {
    id: number;
    product_id: number;
    product_name: string;
    sku?: string | null;
    price: number;
    batch_no?: string | null;
    grn_no?: string | null;
    branch_name?: string | null;
    unit_price: number;
    unit_sales_price: number;
    available_stock: number;
}

export default function PriceDetailsReport() {
    const { t } = useTranslation();
    const { filters, branches, summary, priceDetails } = usePage().props as any;
    const [branchId, setBranchId] = useState(filters.branchId ? String(filters.branchId) : 'all');
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Reports'), href: '#' },
        { title: t('Price Details Report') },
    ];

    const formatCurrency = (amount: number) => {
        return window.appSettings?.formatCurrency(amount) || amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const params: Record<string, string> = { search };

        if (branchId !== 'all') {
            params.branch_id = branchId;
        }

        router.get(route('reports.price-details'), params);
    };

    const handleClearFilters = () => {
        router.get(route('reports.price-details'));
    };

    return (
        <PageTemplate
            title={t('Price Details Report')}
            description={t('Track all product prices with batch and branch availability.')}
            url={route('reports.price-details')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Card className="mb-6 p-4">
                <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-4">
                    <div>
                        <Label htmlFor="branch_id">{t('Branch')}</Label>
                        <Select value={branchId} onValueChange={(value) => setBranchId(value)}>
                            <SelectTrigger id="branch_id" className="w-full">
                                <SelectValue placeholder={t('All Branches')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Branches')}</SelectItem>
                                {(branches as Branch[]).map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="lg:col-span-2">
                        <Label htmlFor="search">{t('Search')}</Label>
                        <Input
                            id="search"
                            type="text"
                            value={search}
                            placeholder={t('Search product, SKU, batch, GRN')}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Button type="submit">{t('Apply Filters')}</Button>
                        <Button type="button" variant="outline" onClick={handleClearFilters}>
                            {t('Clear Filters')}
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Total Rows')}</p>
                    <p className="mt-2 text-2xl font-semibold">{summary.total_items.toLocaleString()}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Products')}</p>
                    <p className="mt-2 text-2xl font-semibold">{summary.total_products.toLocaleString()}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Batches')}</p>
                    <p className="mt-2 text-2xl font-semibold">{summary.total_batches.toLocaleString()}</p>
                </Card>
            </div>

            <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Price List')}</h2>
                    <p className="text-sm text-gray-500">{t('Rows')}: {summary.total_items.toLocaleString()}</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Product')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('SKU')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Batch No')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('GRN No')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Branch')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Product Price')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Unit Sales Price')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Available Stock')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {(priceDetails as PriceDetail[]).length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {t('No price details found')}
                                    </td>
                                </tr>
                            ) : (
                                (priceDetails as PriceDetail[]).map((item, index) => (
                                    <tr key={`${item.product_id}-${item.batch_no || 'no-batch'}-${index}`}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.product_name}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.sku || '-'}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.batch_no || t('No Batch')}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.grn_no || '-'}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.branch_name || t('No Branch')}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(item.price)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600">{formatCurrency(item.unit_sales_price)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{item.available_stock.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </PageTemplate>
    );
}
