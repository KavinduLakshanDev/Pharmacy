import { CrudTable } from '@/components/CrudTable';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import type { TableColumn } from '@/types/crud';
import { router, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddTransactionModal from './_add-transaction-modal';

interface Transaction {
    id: number;
    type: string;
    amount: string;
    description: string | null;
    reference: string | null;
    transaction_date: string;
    account?: { id: number; name: string } | null;
    branch?: { name: string } | null;
    creator?: { name: string } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface FinanceTransactionsPageProps {
    transactions: {
        data: Transaction[];
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    };
    filters?: Record<string, string>;
    accounts: { id: number; name: string }[];
    branches: { id: number; name: string }[];
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export default function FinanceTransactionsPage() {
    const { t } = useTranslation();
    const { transactions, filters: pageFilters = {}, accounts, branches } =
        usePage().props as unknown as FinanceTransactionsPageProps;

    const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id ?? 'all');
    const [selectedType, setSelectedType] = useState(pageFilters.type ?? 'all');
    const [selectedBranch, setSelectedBranch] = useState(pageFilters.branch_id ?? 'all');
    const [dateFrom, setDateFrom] = useState(pageFilters.date_from ?? '');
    const [dateTo, setDateTo] = useState(pageFilters.date_to ?? '');
    const [showFilters, setShowFilters] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Finance'), href: route('finance.dashboard') },
        { title: t('Transactions') },
    ];

    const applyFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('finance.transactions.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                type: selectedType !== 'all' ? selectedType : undefined,
                branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                per_page: pageFilters.per_page,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedAccount('all');
        setSelectedType('all');
        setSelectedBranch('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('finance.transactions.index'), {}, { preserveState: true });
    };

    const hasActiveFilters = () => selectedAccount !== 'all' || selectedType !== 'all' || selectedBranch !== 'all' || !!dateFrom || !!dateTo;
    const activeFilterCount = () => [selectedAccount !== 'all', selectedType !== 'all', selectedBranch !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

    const accountOptions = [{ value: 'all', label: t('All Accounts') }, ...accounts.map((a) => ({ value: String(a.id), label: a.name }))];
    const typeOptions = [{ value: 'all', label: t('All Types') }, { value: 'credit', label: t('Credit') }, { value: 'debit', label: t('Debit') }];
    const branchOptions = [{ value: 'all', label: t('All Branches') }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))];

    const filterOptions = [
        { name: 'account_id', label: t('Account'), type: 'select' as const, options: accountOptions, value: selectedAccount, onChange: setSelectedAccount },
        { name: 'type', label: t('Type'), type: 'select' as const, options: typeOptions, value: selectedType, onChange: setSelectedType },
        { name: 'branch_id', label: t('Branch'), type: 'select' as const, options: branchOptions, value: selectedBranch, onChange: setSelectedBranch },
        { name: 'date_from', label: t('Date From'), type: 'date' as const, value: dateFrom ? new Date(dateFrom) : undefined, onChange: (val: string | Date | undefined) => setDateFrom(val instanceof Date ? val.toISOString().split('T')[0] : (val ?? '')) },
        { name: 'date_to', label: t('Date To'), type: 'date' as const, value: dateTo ? new Date(dateTo) : undefined, onChange: (val: string | Date | undefined) => setDateTo(val instanceof Date ? val.toISOString().split('T')[0] : (val ?? '')) },
    ];

    const tableColumns: TableColumn[] = [
        { key: 'transaction_date', label: t('Date'), sortable: true, render: (v) => new Date(String(v)).toLocaleDateString() },
        { key: 'account', label: t('Account'), render: (v) => (v as Transaction['account'])?.name ?? '—' },
        { key: 'description', label: t('Description'), render: (v) => String(v ?? '—') },
        { key: 'reference', label: t('Reference'), render: (v) => String(v ?? '—') },
        { key: 'type', label: t('Type'), render: (v) => (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${v === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {v === 'credit' ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                {String(v)}
            </span>
        )},
        { key: 'amount', label: t('Amount'), render: (v, row) => {
            const tx = row as unknown as Transaction;
            const amount = parseFloat(String(v));
            return (
                <span className={`font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(amount)}
                </span>
            );
        }},
        { key: 'creator', label: t('By'), render: (v) => (v as Transaction['creator'])?.name ?? '—' },
    ];

    return (
        <PageTemplate
            title={t('Finance Transactions')}
            description={t('View all financial transactions across accounts.')}
            url="/finance/transactions"
            noPadding
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Add Transaction'),
                    icon: <Plus className="h-4 w-4" />,
                    variant: 'default',
                    onClick: () => setAddModalOpen(true),
                },
            ]}
        >
            <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={(e) => { e.preventDefault(); applyFilters(); }}
                    filters={filterOptions}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={clearFilters}
                    onApplyFilters={() => applyFilters()}
                    currentPerPage={String(pageFilters.per_page ?? 15)}
                    onPerPageChange={(perPage) => applyFilters({ per_page: perPage, page: 1 })}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    data={transactions.data}
                    columns={tableColumns}
                    actions={[]}
                    from={transactions.from ?? 0}
                    onAction={() => {}}
                    permissions={[]}
                />
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

            {addModalOpen && (
                <AddTransactionModal
                    accounts={accounts}
                    branches={branches}
                    onClose={() => setAddModalOpen(false)}
                />
            )}
        </PageTemplate>
    );
}
