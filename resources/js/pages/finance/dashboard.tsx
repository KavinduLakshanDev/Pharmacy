import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowDownCircle,
    ArrowLeftRight,
    ArrowUpCircle,
    BarChart3,
    Banknote,
    Building2,
    ChartLine,
    ChevronRight,
    ClipboardList,
    Coins,
    DollarSign,
    Landmark,
    Layers,
    NotebookText,
    ScrollText,
    TrendingUp,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface FinanceAccount {
    id: number;
    name: string;
    account_type: string;
    status: string;
    balance: number;
}

interface RecentTransaction {
    id: number;
    type: string;
    amount: string;
    description: string | null;
    reference: string | null;
    transaction_date: string | null;
    transaction_date_short?: string | null;
    account?: { id: number; name: string } | null;
}

interface DashboardStats {
    totalAccounts: number;
    activeAccounts: number;
    totalTransactions: number;
    totalBalance: number;
    totalCredits: number;
    totalDebits: number;
}

interface NavLinkPayload {
    title: string;
    description: string;
    href: string;
    icon: string;
    visible: boolean;
}

const QUICK_ICON_MAP: Record<string, LucideIcon> = {
    landmark: Landmark,
    'arrow-right-left': ArrowLeftRight,
    coins: Coins,
    banknote: Banknote,
    'building-2': Building2,
};

const REPORT_ICON_MAP: Record<string, LucideIcon> = {
    layers: Layers,
    'notebook-text': NotebookText,
    'scroll-text': ScrollText,
    'clipboard-list': ClipboardList,
    users: Users,
    warehouse: Warehouse,
    'chart-line': ChartLine,
};

interface FinanceDashboardPageProps {
    stats: DashboardStats;
    accounts: FinanceAccount[];
    recentTransactions: RecentTransaction[];
    quickLinks: NavLinkPayload[];
    reportLinks: NavLinkPayload[];
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export default function FinanceDashboardPage() {
    const { t } = useTranslation();
    const { stats, accounts, recentTransactions, quickLinks = [], reportLinks = [] } = usePage().props as unknown as FinanceDashboardPageProps;

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Finance'), href: route('finance.dashboard') },
        { title: t('Dashboard') },
    ];

    const statCards = useMemo(
        () => [
            {
                label: t('Total Balance'),
                value: formatCurrency(stats.totalBalance),
                icon: <Wallet className="text-primary h-5 w-5 shrink-0" />,
                color: 'text-blue-600 dark:text-blue-400',
            },
            {
                label: t('Total Debits'),
                value: formatCurrency(stats.totalDebits),
                icon: <ArrowDownCircle className="h-5 w-5 shrink-0 text-red-500" />,
                color: 'text-red-600 dark:text-red-400',
            },
            {
                label: t('Total Credits'),
                value: formatCurrency(stats.totalCredits),
                icon: <ArrowUpCircle className="h-5 w-5 shrink-0 text-green-500" />,
                color: 'text-green-600 dark:text-green-400',
            },
            {
                label: t('Active Accounts'),
                value: `${stats.activeAccounts} / ${stats.totalAccounts}`,
                icon: <BarChart3 className="h-5 w-5 shrink-0 text-purple-500" />,
                color: 'text-purple-600 dark:text-purple-400',
            },
            {
                label: t('Total Transactions'),
                value: stats.totalTransactions.toLocaleString(),
                icon: <TrendingUp className="h-5 w-5 shrink-0 text-orange-500" />,
                color: 'text-orange-600 dark:text-orange-400',
            },
        ],
        [stats, t],
    );

    const visibleQuick = quickLinks.filter((l) => l.visible);
    const visibleReports = reportLinks.filter((l) => l.visible);

    const primaryLine = (tx: RecentTransaction) => tx.description ?? tx.reference ?? tx.account?.name ?? '—';

    return (
        <PageTemplate
            title={t('Finance Dashboard')}
            description={t('Overview of your financial accounts and transactions.')}
            url={route('finance.dashboard')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="space-y-8 p-4">
                {/* KPI row — one horizontal line (equal-width cards; swipe scroll on narrow screens) */}
                <div className="flex w-full min-w-0 flex-nowrap gap-3 overflow-x-auto pb-1 sm:gap-4 md:overflow-x-visible md:pb-0">
                    {statCards.map((card) => (
                        <Card key={card.label} className="border-border/80 flex min-w-[8.75rem] flex-1 shrink-0 basis-0 flex-col shadow-sm md:min-w-0 md:shrink">
                            <CardContent className="flex flex-1 items-center gap-3 pt-6 pb-6 sm:gap-4">
                                <div className="bg-muted shrink-0 rounded-full p-2.5">{card.icon}</div>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                    <p className="text-muted-foreground truncate text-xs font-medium">{card.label}</p>
                                    <p
                                        className={cn(
                                            'truncate text-base leading-tight font-semibold tabular-nums sm:text-lg',
                                            card.color,
                                        )}
                                    >
                                        {card.value}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick access */}
                <section className="space-y-3">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">{t('Quick access')}</h2>
                        <p className="text-muted-foreground text-sm">{t('Jump to core finance workflows')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {visibleQuick.map((link) => {
                            const Icon = QUICK_ICON_MAP[link.icon] ?? Landmark;
                            return (
                                <Link key={link.href} href={link.href} className="group block h-full outline-none">
                                    <Card className="border-border/80 hover:border-primary/40 hover:bg-accent/40 h-full transition-colors">
                                        <CardContent className="flex h-full flex-col gap-3 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="bg-primary/10 text-primary rounded-lg p-2">
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold leading-tight">{t(link.title)}</p>
                                                <p className="text-muted-foreground mt-1 text-xs">{t(link.description)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Finance reports */}
                {visibleReports.length > 0 && (
                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">{t('Finance reports')}</h2>
                            <p className="text-muted-foreground text-sm">{t('Reporting aligned with receipts, ledgers & receivables')}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {visibleReports.map((link) => {
                                const Icon = REPORT_ICON_MAP[link.icon] ?? Layers;
                                return (
                                    <Link key={link.href} href={link.href} className="group block h-full outline-none">
                                        <Card className={cn('border-border/80 hover:border-primary/30 h-full border-dashed transition-colors')}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="bg-muted rounded-md p-2">
                                                        <Icon className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                                                    </span>
                                                    <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0" />
                                                </div>
                                                <CardTitle className="text-base">{t(link.title)}</CardTitle>
                                                <CardDescription className="text-xs">{t(link.description)}</CardDescription>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Accounts */}
                    <Card className="border-border/80 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                {t('Account Balances')}
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 shrink-0" asChild>
                                <Link href={route('finance.accounts.index')}>{t('View all')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {accounts.length === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('No accounts found.')}</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-muted-foreground border-b">
                                                <th className="pb-2 text-left font-medium">{t('Account')}</th>
                                                <th className="pb-2 text-left font-medium">{t('Type')}</th>
                                                <th className="pb-2 text-right font-medium">{t('Balance')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accounts.map((account) => (
                                                <tr key={account.id} className="border-border/70 border-b last:border-0">
                                                    <td className="py-2.5">
                                                        <Link
                                                            href={route('finance.accounts.show', { account: account.id })}
                                                            className="text-primary font-medium hover:underline"
                                                        >
                                                            {account.name}
                                                        </Link>
                                                    </td>
                                                    <td className="text-muted-foreground py-2.5 capitalize">{account.account_type}</td>
                                                    <td className={`py-2.5 text-right font-medium tabular-nums ${account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(account.balance)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transactions */}
                    <Card className="border-border/80 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <TrendingUp className="text-primary h-4 w-4" />
                                {t('Recent Transactions')}
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 shrink-0" asChild>
                                <Link href={route('finance.transactions.index')}>{t('View all')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('No transactions yet.')}</p>
                            ) : (
                                <ul className="divide-border/60 divide-y">
                                    {recentTransactions.map((tx) => (
                                        <li key={tx.id} className="flex gap-3 py-3 first:pt-0">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{primaryLine(tx)}</p>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {tx.account?.name ?? '—'} · {tx.transaction_date_short ?? tx.transaction_date ?? ''}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 text-sm font-semibold tabular-nums ${tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}
                                                {formatCurrency(Number.parseFloat(tx.amount))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}
