import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { DollarSign, Package, Percent, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface SalesReportItem {
    sale_id: number;
    sale_no: string;
    sale_date: string;
    status: string;
    customer_name: string;
    product_name: string;
    batch_no?: string | null;
    quantity: number;
    unit_price: number;
    unit_cost_price: number;
    net_sales: number;
    cost_amount: number;
    profit: number;
    margin: number;
}

export default function SalesReport() {
    const { t } = useTranslation();
    const { filters, statuses, summary, items } = usePage().props as any;
    const [dateFrom, setDateFrom] = useState(filters.dateFrom);
    const [dateTo, setDateTo] = useState(filters.dateTo);
    const [status, setStatus] = useState(filters.status || 'completed');
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Reports'), href: '#' },
        { title: t('Sales Report') },
    ];

    const formatCurrency = (amount: number) => {
        return window.appSettings?.formatCurrency(amount) || amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const getStatusLabel = (value: string) => {
        if (value === 'all') {
            return t('All Statuses');
        }

        return t(value.charAt(0).toUpperCase() + value.slice(1));
    };

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('reports.sales-report'), {
            date_from: dateFrom,
            date_to: dateTo,
            status,
            search,
        });
    };

    const handleClearFilters = () => {
        router.get(route('reports.sales-report'));
    };

    const summaryCards = [
        {
            title: t('Net Sales'),
            value: formatCurrency(summary.total_sales),
            icon: <DollarSign className="h-6 w-6 text-green-600" />,
            iconColor: 'bg-green-100',
        },
        {
            title: t('Total Cost'),
            value: formatCurrency(summary.total_cost),
            icon: <Package className="h-6 w-6 text-orange-600" />,
            iconColor: 'bg-orange-100',
        },
        {
            title: t('Profit'),
            value: formatCurrency(summary.total_profit),
            icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
            iconColor: 'bg-blue-100',
        },
        {
            title: t('Profit Margin'),
            value: `${Number(summary.profit_margin).toFixed(2)}%`,
            icon: <Percent className="h-6 w-6 text-purple-600" />,
            iconColor: 'bg-purple-100',
        },
    ];

    return (
        <PageTemplate
            title={t('Sales Report')}
            description={t('Sales, cost, and profit report by sold item.')}
            url={route('reports.sales-report')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Card className="mb-6 p-4">
                <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-6">
                    <div>
                        <Label htmlFor="date_from">{t('From Date')}</Label>
                        <Input id="date_from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="date_to">{t('To Date')}</Label>
                        <Input id="date_to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="status">{t('Status')}</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value)}>
                            <SelectTrigger id="status" className="w-full">
                                <SelectValue placeholder={t('Select status')} />
                            </SelectTrigger>
                            <SelectContent>
                                {(statuses as string[]).map((statusValue) => (
                                    <SelectItem key={statusValue} value={statusValue}>
                                        {getStatusLabel(statusValue)}
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
                            placeholder={t('Search sale, customer, product, batch')}
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

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card) => (
                    <Card key={card.title} className="p-6">
                        <div className="flex items-center">
                            <div className={`rounded-lg p-2 ${card.iconColor}`}>{card.icon}</div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Sales Profit Details')}</h2>
                    <p className="text-sm text-gray-500">{t('Items')}: {summary.total_items.toLocaleString()}</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Sale No')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Customer')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Product')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Batch')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Qty')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Unit Price')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Unit Cost')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Net Sales')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Cost')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Profit')}</th>
                                {/* <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Margin')}</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {(items as SalesReportItem[]).length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {t('No sales found')}
                                    </td>
                                </tr>
                            ) : (
                                (items as SalesReportItem[]).map((item, index) => (
                                    <tr key={`${item.sale_id}-${item.product_name}-${item.batch_no}-${index}`}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.sale_no}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.customer_name}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.product_name}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.batch_no || '-'}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{item.quantity.toLocaleString()}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(item.unit_cost_price)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600">{formatCurrency(item.net_sales)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-orange-600">{formatCurrency(item.cost_amount)}</td>
                                        <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${item.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                            {formatCurrency(item.profit)}
                                        </td>
                                        {/* <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{item.margin.toFixed(2)}%</td> */}
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
