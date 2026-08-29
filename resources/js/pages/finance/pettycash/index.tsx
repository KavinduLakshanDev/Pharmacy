import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddEntryModal from './_add-entry-modal';
import ManageCategoriesPanel from './_manage-categories-panel';

interface PettyCashEntry {
    id: number;
    type: string;
    particulars: string;
    total_amount: string;
    entry_date: string;
    reference: string | null;
    notes: string | null;
    branch?: { name: string } | null;
    account?: { name: string } | null;
    creator?: { name: string } | null;
}

interface PettyCashCategory {
    id: number;
    name: string;
    status: string;
    sort_order: number | null;
}

interface FinanceAccount {
    id: number;
    name: string;
    account_type: string;
}

interface Branch {
    id: number;
    name: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PettyCashPageProps {
    entries: {
        data: PettyCashEntry[];
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    };
    categories: PettyCashCategory[];
    accounts: FinanceAccount[];
    branches: Branch[];
    availableBalance: number;
    cashReceived: number;
    totalUsage: number;
    usageCount: number;
    filters?: Record<string, string>;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export default function PettyCashPage() {
    const { t } = useTranslation();
    const { entries, categories, accounts, branches, availableBalance, cashReceived, totalUsage, usageCount, filters: pageFilters = {} } =
        usePage().props as unknown as PettyCashPageProps;

    const [addEntryOpen, setAddEntryOpen] = useState(false);
    const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentEntry, setCurrentEntry] = useState<PettyCashEntry | null>(null);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Finance'), href: route('finance.dashboard') },
        { title: t('Petty Cash') },
    ];

    const handleDelete = (entry: PettyCashEntry) => {
        setCurrentEntry(entry);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!currentEntry) return;
        router.delete(route('finance.pettycash.entries.destroy', currentEntry.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const summaryCards = [
        {
            label: t('Available Balance'),
            value: formatCurrency(availableBalance),
            icon: <Wallet className="h-5 w-5 text-blue-500" />,
            color: availableBalance >= 0 ? 'text-blue-600' : 'text-red-600',
        },
        {
            label: t('Cash Received'),
            value: formatCurrency(cashReceived),
            icon: <ArrowUpCircle className="h-5 w-5 text-green-500" />,
            color: 'text-green-600',
        },
        {
            label: t('Total Usage'),
            value: formatCurrency(totalUsage),
            icon: <ArrowDownCircle className="h-5 w-5 text-red-500" />,
            color: 'text-red-600',
        },
    ];

    return (
        <PageTemplate
            title={t('Petty Cash')}
            description={t('Manage petty cash reimbursements and usage.')}
            url="/finance/pettycash"
            noPadding
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Add Entry'),
                    icon: <Plus className="h-4 w-4" />,
                    variant: 'default',
                    onClick: () => setAddEntryOpen(true),
                },
                {
                    label: t('Categories'),
                    variant: 'outline',
                    onClick: () => setManageCategoriesOpen(true),
                },
            ]}
        >
            <div className="space-y-6 p-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                            <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">{card.icon}</div>
                            <div>
                                <p className="text-muted-foreground text-xs">{card.label}</p>
                                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Entries Table */}
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">{t('Date')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Type')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Particulars')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Account')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('Branch')}</th>
                                    <th className="px-4 py-3 text-right font-medium">{t('Amount')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('By')}</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center text-sm">
                                            {t('No petty cash entries yet.')}
                                        </td>
                                    </tr>
                                ) : (
                                    entries.data.map((entry) => (
                                        <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3">{entry.entry_date}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${entry.type === 'reimbursement' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {entry.type === 'reimbursement'
                                                        ? <ArrowUpCircle className="h-3 w-3" />
                                                        : <ArrowDownCircle className="h-3 w-3" />
                                                    }
                                                    {t(entry.type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{entry.particulars}</td>
                                            <td className="text-muted-foreground px-4 py-3 text-xs">{entry.account?.name ?? '—'}</td>
                                            <td className="text-muted-foreground px-4 py-3 text-xs">{entry.branch?.name ?? '—'}</td>
                                            <td className={`px-4 py-3 text-right font-medium ${entry.type === 'reimbursement' ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(parseFloat(entry.total_amount))}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 text-xs">{entry.creator?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleDelete(entry)}
                                                    className="text-red-400 hover:text-red-600"
                                                    aria-label={t('Delete')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={entries.current_page ?? 1}
                        lastPage={entries.last_page ?? 1}
                        total={entries.total ?? 0}
                        from={entries.from}
                        to={entries.to}
                        links={entries.links ?? []}
                        entityName={t('entries')}
                    />
                </div>
            </div>

            {addEntryOpen && (
                <AddEntryModal
                    branches={branches}
                    categories={categories}
                    onClose={() => setAddEntryOpen(false)}
                />
            )}

            {manageCategoriesOpen && (
                <ManageCategoriesPanel
                    categories={categories}
                    onClose={() => setManageCategoriesOpen(false)}
                />
            )}

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentEntry?.particulars}
                entityName={t('Entry')}
            />
        </PageTemplate>
    );
}
