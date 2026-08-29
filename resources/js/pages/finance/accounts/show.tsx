import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { router, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Edit, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FinanceAccount {
    id: number;
    name: string;
    account_type: string;
    status: string;
    balance: number;
    description: string | null;
    bank_branch: string | null;
    bank_account_no: string | null;
}

interface Transaction {
    id: number;
    type: string;
    amount: string;
    description: string | null;
    reference: string | null;
    transaction_date: string;
    creator?: { name: string } | null;
    branch?: { name: string } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ShowAccountPageProps {
    account: FinanceAccount;
    transactions: {
        data: Transaction[];
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    };
    dateFilter: { date_from?: string; date_to?: string };
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export default function ShowFinanceAccountPage() {
    const { t } = useTranslation();
    const { account, transactions, dateFilter } = usePage().props as unknown as ShowAccountPageProps;

    const [dateFrom, setDateFrom] = useState(dateFilter.date_from ?? '');
    const [dateTo, setDateTo] = useState(dateFilter.date_to ?? '');

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Finance'), href: route('finance.dashboard') },
        { title: t('Accounts'), href: route('finance.accounts.index') },
        { title: account.name },
    ];

    const applyDateFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('finance.accounts.show', account.id), {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <PageTemplate
            title={account.name}
            description={`${account.account_type} account`}
            url={`/finance/accounts/${account.id}`}
            breadcrumbs={breadcrumbs}
            noPadding
            actions={[
                {
                    label: t('Edit Account'),
                    icon: <Edit className="h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('finance.accounts.edit', account.id)),
                },
            ]}
        >
            <div className="space-y-6 p-4">
                {/* Balance Card */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                        <div className="flex items-center gap-3">
                            <Wallet className="h-6 w-6 text-blue-500" />
                            <div>
                                <p className="text-muted-foreground text-xs">{t('Current Balance')}</p>
                                <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(account.balance)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                        <p className="text-muted-foreground text-xs">{t('Account Type')}</p>
                        <p className="mt-1 text-sm font-semibold capitalize">{account.account_type}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                        <p className="text-muted-foreground text-xs">{t('Status')}</p>
                        <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {account.status}
                        </span>
                    </div>
                </div>

                {/* Date Filter */}
                <form onSubmit={applyDateFilter} className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                    <div className="space-y-1">
                        <label className="text-xs font-medium">{t('From')}</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            className="block rounded border px-3 py-1.5 text-sm dark:bg-gray-800" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium">{t('To')}</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                            className="block rounded border px-3 py-1.5 text-sm dark:bg-gray-800" />
                    </div>
                    <button type="submit" className="rounded bg-primary px-4 py-1.5 text-sm text-white">
                        {t('Filter')}
                    </button>
                    {(dateFrom || dateTo) && (
                        <button type="button" onClick={() => {
                            setDateFrom('');
                            setDateTo('');
                            router.get(route('finance.accounts.show', account.id), {}, { preserveState: true });
                        }} className="text-muted-foreground text-sm underline">
                            {t('Clear')}
                        </button>
                    )}
                </form>

                {/* Transactions Table */}
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">{t('Date')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Description')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Reference')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Type')}</th>
                                    <th className="px-4 py-3 text-right font-medium">{t('Amount')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Created By')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center text-sm">
                                            {t('No transactions found.')}
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.data.map((tx) => (
                                        <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">{tx.description ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-500">{tx.reference ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {tx.type === 'credit'
                                                        ? <ArrowUpCircle className="h-3 w-3" />
                                                        : <ArrowDownCircle className="h-3 w-3" />
                                                    }
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 text-xs">{tx.creator?.name ?? '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={transactions.current_page ?? 1}
                        lastPage={transactions.last_page ?? 1}
                        total={transactions.total ?? 0}
                        from={transactions.from}
                        to={transactions.to}
                        links={transactions.links ?? []}
                        entityName={t('transactions')}
                    />
                </div>
            </div>
        </PageTemplate>
    );
}
