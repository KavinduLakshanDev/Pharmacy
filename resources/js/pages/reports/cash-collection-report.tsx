import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Banknote, Building2, CreditCard, RotateCcw, TrendingUp, User, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface SelectOption {
    value: string;
    label: string;
}

interface CashRow {
    date: string;
    reference: string;
    customer: string;
    type: string;
    type_key: string;
    method: string;
    amount: number;
    cash_in: number;
    cash_out: number;
    balance: number;
    balance_direction: string;
}

interface PaginatedRows {
    data: CashRow[];
    from?: number;
    to?: number;
    total: number;
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface CashCollectionReportPageProps extends Record<string, unknown> {
    filters: Record<string, string | number>;
    branches: SelectOption[];
    customerOptions: SelectOption[];
    paymentMethodOptions: SelectOption[];
    summary: Record<string, number | string>;
    rows: PaginatedRows;
}

function typeBadgeClass(typeKey: string): string {
    switch (typeKey) {
        case 'opening_balance':
            return 'bg-violet-100 text-violet-800';
        case 'pos_sale':
            return 'bg-orange-100 text-orange-800';
        case 'credit_payment':
            return 'bg-cyan-100 text-cyan-800';
        case 'supplier_payment':
            return 'bg-pink-100 text-pink-800';
        case 'customer_return':
            return 'bg-amber-100 text-amber-900';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export default function CashCollectionReport() {
    const { t } = useTranslation();
    const { filters, branches, customerOptions, paymentMethodOptions, summary, rows } =
        usePage<CashCollectionReportPageProps>().props;

    const [dateFrom, setDateFrom] = useState(String(filters.date_from ?? ''));
    const [dateTo, setDateTo] = useState(String(filters.date_to ?? ''));
    const [branchId, setBranchId] = useState(String(filters.branch_id ?? ''));
    const [customerId, setCustomerId] = useState(String(filters.customer_id ?? ''));
    const [paymentMethod, setPaymentMethod] = useState(String(filters.payment_method ?? 'all'));
    const [search, setSearch] = useState(String(filters.search ?? ''));
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 25));

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Reports'), href: '#' },
        { title: t('Cash Collection Report') },
    ];

    const formatCurrency = (amount: number) => {
        return (
            window.appSettings?.formatCurrency(amount) ||
            amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
    };

    const applyFilters = (extra: Record<string, string | number> = {}) => {
        router.get(
            route('reports.cash-collection'),
            {
                date_from: dateFrom,
                date_to: dateTo,
                branch_id: branchId || undefined,
                customer_id: customerId || undefined,
                payment_method: paymentMethod,
                search: search || undefined,
                per_page: perPage,
                ...extra,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters({ page: 1 });
    };

    const handleClearFilters = () => {
        router.get(route('reports.cash-collection'));
    };

    const summaryCards = [
        {
            title: t('Total entries'),
            value: String(summary.total_entries ?? 0),
            icon: <TrendingUp className="h-6 w-6 text-gray-600" />,
            iconColor: 'bg-gray-100',
        },
        {
            title: t('Opening balance'),
            value: formatCurrency(Number(summary.opening_balance ?? 0)),
            icon: <Wallet className="h-6 w-6 text-violet-600" />,
            iconColor: 'bg-violet-100',
        },
        {
            title: t('Total cash in'),
            value: formatCurrency(Number(summary.total_cash_in ?? 0)),
            icon: <ArrowDownRight className="h-6 w-6 text-green-600" />,
            iconColor: 'bg-green-100',
        },
        {
            title: t('Total cash out'),
            value: formatCurrency(Number(summary.total_cash_out ?? 0)),
            icon: <ArrowUpRight className="h-6 w-6 text-red-600" />,
            iconColor: 'bg-red-100',
        },
        {
            title: t('Sales collected'),
            value: formatCurrency(Number(summary.sales_collected ?? 0)),
            icon: <Banknote className="h-6 w-6 text-blue-600" />,
            iconColor: 'bg-blue-100',
        },
        {
            title: t('Credit payments'),
            value: formatCurrency(Number(summary.credit_payments ?? 0)),
            icon: <CreditCard className="h-6 w-6 text-teal-600" />,
            iconColor: 'bg-teal-100',
        },
        {
            title: t('Return settlements'),
            value: formatCurrency(Number(summary.customer_return_settlements ?? 0)),
            icon: <RotateCcw className="h-6 w-6 text-amber-700" />,
            iconColor: 'bg-amber-100',
        },
        {
            title: t('Supplier payments'),
            value: formatCurrency(Number(summary.supplier_payments ?? 0)),
            icon: <Building2 className="h-6 w-6 text-pink-600" />,
            iconColor: 'bg-pink-100',
        },
    ];

    return (
        <PageTemplate
            title={t('Cash Collection Report')}
            description={t(
                'Cash movements from POS sessions, sales, customer receipts (including return exchange settlements), and supplier payments.',
            )}
            url={route('reports.cash-collection')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Card className="mb-6 p-4">
                <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-3">
                        <Label htmlFor="search">{t('Search')}</Label>
                        <Input
                            id="search"
                            type="text"
                            value={search}
                            placeholder={t('Sale #, payment #, return #, customer...')}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <Label htmlFor="date_from">{t('From Date')}</Label>
                        <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="lg:col-span-2">
                        <Label htmlFor="date_to">{t('To Date')}</Label>
                        <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <div className="lg:col-span-2">
                        <Label>{t('Branch')}</Label>
                        <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('All branches')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All branches')}</SelectItem>
                                {branches.map((b) => (
                                    <SelectItem key={b.value} value={b.value}>
                                        {b.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="lg:col-span-2">
                        <Label>{t('Customer')}</Label>
                        <Select value={customerId || 'all'} onValueChange={(v) => setCustomerId(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('All customers')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All customers')}</SelectItem>
                                {customerOptions.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="lg:col-span-2">
                        <Label>{t('Payment method')}</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethodOptions.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="lg:col-span-2">
                        <Label>{t('Per page')}</Label>
                        <Select value={perPage} onValueChange={setPerPage}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['10', '25', '50', '100'].map((n) => (
                                    <SelectItem key={n} value={n}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2 lg:col-span-3 lg:justify-end">
                        <Button type="submit" className="w-full">
                            {t('Apply')}
                        </Button>
                        <Button type="button" variant="outline" className="w-full" onClick={handleClearFilters}>
                            {t('Clear')}
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
                {summaryCards.map((card) => (
                    <Card key={card.title} className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${card.iconColor}`}>{card.icon}</div>
                            <div>
                                <p className="text-xs font-medium text-gray-600">{card.title}</p>
                                <p className="text-lg font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="mb-6 border-2 border-green-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <User className="h-6 w-6 text-green-700" />
                        <span className="font-semibold text-gray-800">{t('Net cash')}</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(Number(summary.net_cash ?? 0))}{' '}
                        <span className="text-base font-semibold">{summary.net_direction as string}</span>
                    </p>
                </div>
            </Card>

            <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Cash movements')}</h2>
                    <p className="text-sm text-gray-500">
                        {t('Entries')}: {(rows?.total ?? 0).toLocaleString()}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Date')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Reference')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Customer')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Type')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Method')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Amount')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Cash in')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Cash out')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('Balance')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {!rows?.data?.length ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                                        {t('No entries found')}
                                    </td>
                                </tr>
                            ) : (
                                rows.data.map((row) => (
                                    <tr key={`${row.reference}-${row.date}-${row.type_key}`}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{row.date}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                            {row.reference}
                                        </td>
                                        <td className="max-w-[12rem] truncate px-4 py-3 text-sm text-gray-700">{row.customer}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass(row.type_key)}`}
                                            >
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                                {row.method}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                                            {formatCurrency(row.amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-700">
                                            {row.cash_in > 0 ? formatCurrency(row.cash_in) : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-red-700">
                                            {row.cash_out > 0 ? formatCurrency(row.cash_out) : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                                            {formatCurrency(row.balance)} {row.balance_direction}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {rows && rows.last_page > 1 ? (
                    <div className="mt-6">
                        <Pagination
                            from={rows.from}
                            to={rows.to}
                            total={rows.total}
                            links={rows.links}
                            currentPage={rows.current_page}
                            lastPage={rows.last_page}
                            entityName={t('entries')}
                            onPageChange={(url) => {
                                if (!url) {
                                    return;
                                }
                                router.visit(url, { preserveState: true });
                            }}
                        />
                    </div>
                ) : null}
            </Card>
        </PageTemplate>
    );
}
