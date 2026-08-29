import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { hasPermission } from '@/utils/authorization';
import { Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Activity,
    ArrowRight,
    ClipboardList,
    Container,
    DollarSign,
    FileSearch,
    Layers,
    Package,
    PackageSearch,
    Pill,
    Printer,
    Trash2,
    Truck,
    Undo2,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
    active_products: number;
    low_stock_products: number;
    pending_transfers: number;
    pending_wastages: number;
    grn_count: number;
    movements_last_30_days: number;
}

const EMPTY_DASHBOARD_STATS: DashboardStats = {
    active_products: 0,
    low_stock_products: 0,
    pending_transfers: 0,
    pending_wastages: 0,
    grn_count: 0,
    movements_last_30_days: 0,
};

type QuickLinkDef = {
    title: string;
    description: string;
    href: string;
    permission: string | string[];
    icon: LucideIcon;
};

export default function InventoryDashboardPage() {
    const { t } = useTranslation();
    const page = usePage<{
        stats?: DashboardStats;
        auth?: { permissions?: string[] };
    }>();
    const stats: DashboardStats = { ...EMPTY_DASHBOARD_STATS, ...(page.props.stats ?? {}) };
    const permissions = page.props.auth?.permissions ?? [];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Dashboard') },
    ];

    const pageActions = [
        {
            label: t('Print'),
            icon: <Printer className="mr-2 h-4 w-4" />,
            variant: 'ghost' as const,
            onClick: (): void => window.print(),
        },
    ];

    const quickLinks: QuickLinkDef[] = [
        {
            title: t('Audit'),
            description: t('Review inventory movements and compliance trail.'),
            href: route('inventory.audit'),
            permission: 'view-inventory-audit',
            icon: FileSearch,
        },
        {
            title: t('Transactions'),
            description: t('Stock movements, sales, GRN and adjustment history.'),
            href: route('inventory.transactions.index'),
            permission: 'view-inventory-transactions',
            icon: Activity,
        },
        {
            title: t('Stock Bin Card'),
            description: t('Batch-level stock and expiry by product.'),
            href: route('inventory.stock-bin-card'),
            permission: 'view-inventory-transactions',
            icon: PackageSearch,
        },
        {
            title: t('Stock In Hand'),
            description: t('Current on-hand quantities by product.'),
            href: route('inventory.stock-in-hand'),
            permission: 'view-inventory-transactions',
            icon: Layers,
        },
        {
            title: t('Supplier Payments'),
            description: t('Record payments against supplier invoices / GRNs.'),
            href: route('inventory.supplier-payments.index'),
            permission: 'view-inventory-transactions',
            icon: DollarSign,
        },
        {
            title: t('Customer Payments'),
            description: t('Allocate customer receipts to outstanding sales.'),
            href: route('inventory.customer-payments.index'),
            permission: 'view-inventory-transactions',
            icon: DollarSign,
        },
        {
            title: t('Supplier Returns'),
            description: t('Return stock to suppliers from GRNs.'),
            href: route('inventory.supplier-returns.index'),
            permission: 'view-inventory-transactions',
            icon: Undo2,
        },
        {
            title: t('Drug Destroys'),
            description: t('Record destruction of expiring stock not returned to suppliers.'),
            href: route('inventory.drug-destroys.index'),
            permission: ['view-drug-destroys', 'view-inventory-transactions'],
            icon: Trash2,
        },
        {
            title: t('Customer Returns'),
            description: t('Process customer sales returns and refunds.'),
            href: route('inventory.customer-returns.index'),
            permission: 'view-inventory-transactions',
            icon: Undo2,
        },
        {
            title: t('Stock Transfers'),
            description: t('Move stock between branches with approval.'),
            href: route('inventory.stock-transfers.index'),
            permission: 'manage-inventory',
            icon: Truck,
        },
        {
            title: t('Wastages'),
            description: t('Record and approve destroyed or expired stock.'),
            href: route('inventory.wastages.index'),
            permission: 'manage-inventory',
            icon: Trash2,
        },
        {
            title: t('Prescriptions'),
            description: t('Review customer-uploaded prescriptions.'),
            href: route('inventory.prescriptions.index'),
            permission: 'manage-prescriptions',
            icon: Pill,
        },
        {
            title: t('GRNs'),
            description: t('Goods received notes and purchase receipts.'),
            href: route('grns.index'),
            permission: 'manage-grns',
            icon: ClipboardList,
        },
    ];

    const visibleLinks = quickLinks.filter((link) =>
        Array.isArray(link.permission)
            ? link.permission.some((p) => hasPermission(permissions, p))
            : hasPermission(permissions, link.permission),
    );

    const statCards = [
        {
            label: t('Active products'),
            value: stats.active_products,
            hint: t('Listed as active in your catalog'),
            icon: Package,
            tone: 'text-sky-600',
        },
        {
            label: t('Low or zero stock'),
            value: stats.low_stock_products,
            hint: t('At or below reorder level'),
            icon: Container,
            tone: stats.low_stock_products > 0 ? 'text-amber-600' : 'text-emerald-600',
        },
        {
            label: t('Pending transfers'),
            value: stats.pending_transfers,
            hint: t('Awaiting approval or acceptance'),
            icon: Truck,
            tone: stats.pending_transfers > 0 ? 'text-amber-600' : 'text-muted-foreground',
        },
        {
            label: t('Pending wastages'),
            value: stats.pending_wastages,
            hint: t('Needs approval'),
            icon: Trash2,
            tone: stats.pending_wastages > 0 ? 'text-amber-600' : 'text-muted-foreground',
        },
        {
            label: t('Goods received (GRNs)'),
            value: stats.grn_count,
            hint: t('Total GRN documents'),
            icon: ClipboardList,
            tone: 'text-violet-600',
        },
        {
            label: t('Stock movements (30d)'),
            value: stats.movements_last_30_days,
            hint: t('Master transaction rows'),
            icon: Activity,
            tone: 'text-teal-600',
        },
    ];

    return (
        <PageTemplate
            title={t('Inventory Dashboard')}
            description={t('Overview of inventory status and activities.')}
            url={route('inventory.dashboard')}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="space-y-8 p-4 print:space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    {statCards.map((card) => {
                        const StatIcon = card.icon;
                        return (
                        <Card key={card.label} className="overflow-hidden border-l-4 border-l-primary/40 shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                                    {card.label}
                                </CardTitle>
                                <StatIcon className={`h-4 w-4 shrink-0 ${card.tone}`} />
                            </CardHeader>
                            <CardContent>
                                <p className={`text-3xl font-bold tabular-nums ${card.tone}`}>{card.value.toLocaleString()}</p>
                                <p className="text-muted-foreground mt-1 text-xs">{card.hint}</p>
                            </CardContent>
                        </Card>
                        );
                    })}
                </div>

                <div>
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">{t('Quick access')}</h2>
                            <p className="text-muted-foreground text-sm">{t('Jump to inventory tools based on your permissions.')}</p>
                        </div>
                        {visibleLinks.length > 0 && (
                            <Badge variant="secondary" className="w-fit">
                                {visibleLinks.length} {t('shortcuts')}
                            </Badge>
                        )}
                    </div>

                    {visibleLinks.length === 0 ? (
                        <Card>
                            <CardContent className="text-muted-foreground py-10 text-center text-sm">
                                {t('No inventory modules are available for your role. Contact an administrator.')}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibleLinks.map((item) => {
                                const QuickIcon = item.icon;
                                return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                >
                                    <Card className="h-full transition-shadow group-hover:shadow-md group-focus-visible:shadow-md">
                                        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                                            <div className="bg-primary/10 text-primary rounded-lg p-2">
                                                <QuickIcon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="flex items-center gap-1 text-base leading-tight">
                                                    <span className="truncate">{item.title}</span>
                                                    <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                                                </CardTitle>
                                                <CardDescription className="mt-1.5 text-sm leading-snug">{item.description}</CardDescription>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Card className="bg-muted/30 border-dashed print:hidden">
                    <CardContent className="text-muted-foreground py-6 text-sm">
                        <p>
                            <strong className="text-foreground">{t('Tip')}:</strong>{' '}
                            {t('Use Stock In Hand and Stock Bin Card for batch expiry; use Transactions for full movement history.')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
