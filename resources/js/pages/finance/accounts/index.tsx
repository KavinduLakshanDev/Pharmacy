import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudTable } from '@/components/CrudTable';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { showToast } from '@/components/ui/toast-notification';
import type { TableColumn } from '@/types/crud';
import { router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FinanceAccount {
    id: number;
    name: string;
    account_type: string;
    status: string;
    balance: number;
    branch?: { name: string } | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface FinanceAccountsPageProps {
    accounts: {
        data: FinanceAccount[];
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        links?: PaginationLink[];
    };
    filters?: Record<string, string>;
    accountTypes: { value: string; label: string }[];
    statusOptions: { value: string; label: string }[];
    branches: { id: number; name: string }[];
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export default function FinanceAccountsPage() {
    const { t } = useTranslation();
    const { accounts, filters: pageFilters = {}, accountTypes, statusOptions, branches } =
        usePage().props as unknown as FinanceAccountsPageProps;

    const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
    const [selectedType, setSelectedType] = useState(pageFilters.account_type ?? 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status ?? 'all');
    const [selectedBranch, setSelectedBranch] = useState(pageFilters.branch_id ?? 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<FinanceAccount | null>(null);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Finance'), href: route('finance.dashboard') },
        { title: t('Accounts') },
    ];

    const applyFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            route('finance.accounts.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                account_type: selectedType !== 'all' ? selectedType : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
                per_page: pageFilters.per_page,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedStatus('all');
        setSelectedBranch('all');
        router.get(route('finance.accounts.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: string) => applyFilters({ per_page: perPage, page: 1 });

    const hasActiveFilters = () => selectedType !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all' || !!searchTerm;
    const activeFilterCount = () => [selectedType !== 'all', selectedStatus !== 'all', selectedBranch !== 'all'].filter(Boolean).length;

    const typeOptions = [{ value: 'all', label: t('All Types') }, ...accountTypes.map((t) => ({ value: t.value, label: t.label }))];
    const statusOpts = [{ value: 'all', label: t('All Statuses') }, ...statusOptions.map((s) => ({ value: s.value, label: s.label }))];
    const branchOptions = [{ value: 'all', label: t('All Branches') }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))];

    const filterOptions = [
        { name: 'account_type', label: t('Account Type'), type: 'select' as const, options: typeOptions, value: selectedType, onChange: setSelectedType },
        { name: 'status', label: t('Status'), type: 'select' as const, options: statusOpts, value: selectedStatus, onChange: setSelectedStatus },
        { name: 'branch_id', label: t('Branch'), type: 'select' as const, options: branchOptions, value: selectedBranch, onChange: setSelectedBranch },
    ];

    const tableColumns: TableColumn[] = [
        { key: 'name', label: t('Account Name'), sortable: true },
        { key: 'account_type', label: t('Type'), render: (v) => <span className="capitalize">{String(v)}</span> },
        { key: 'balance', label: t('Balance'), render: (v) => {
            const balance = Number(v);
            return <span className={balance >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{formatCurrency(balance)}</span>;
        }},
        { key: 'status', label: t('Status'), render: (v) => (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {String(v)}
            </span>
        )},
        { key: 'branch', label: t('Branch'), render: (v) => (v as FinanceAccount['branch'])?.name ?? '—' },
        { key: 'created_at', label: t('Created'), render: (v) => new Date(String(v)).toLocaleDateString() },
    ];

    const tableActions = [
        { label: t('View'), icon: 'Eye', className: 'text-blue-500', action: 'view' },
        { label: t('Edit'), icon: 'Edit', className: 'text-amber-500', action: 'edit' },
    ];

    const handleTableAction = (action: string, item: FinanceAccount) => {
        if (action === 'view') {
            router.visit(route('finance.accounts.show', item.id));
        } else if (action === 'edit') {
            router.visit(route('finance.accounts.edit', item.id));
        } else if (action === 'delete') {
            setCurrentItem(item);
            setIsDeleteModalOpen(true);
        }
    };

    const handleDeleteConfirm = () => {
        if (!currentItem) return;
        router.delete(route('finance.accounts.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                showToast(t('Account deleted successfully.'), 'success');
            },
        });
    };

    return (
        <PageTemplate
            title={t('Finance Accounts')}
            description={t('Manage your financial accounts and track balances.')}
            url="/finance/accounts"
            noPadding
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Add Account'),
                    icon: <Plus className="h-4 w-4" />,
                    variant: 'default',
                    onClick: () => router.visit(route('finance.accounts.create')),
                },
            ]}
        >
            <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={filterOptions}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={clearFilters}
                    onApplyFilters={() => applyFilters()}
                    currentPerPage={String(pageFilters.per_page ?? 10)}
                    onPerPageChange={handlePerPageChange}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    data={accounts.data}
                    columns={tableColumns}
                    actions={tableActions}
                    from={accounts.from ?? 0}
                    onAction={handleTableAction}
                    permissions={[]}
                />
                <Pagination
                    currentPage={accounts.current_page ?? 1}
                    lastPage={accounts.last_page ?? 1}
                    total={accounts.total ?? 0}
                    from={accounts.from}
                    to={accounts.to}
                    links={accounts.links ?? []}
                    entityName={t('accounts')}
                />
            </div>

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name}
                entityName={t('Account')}
            />
        </PageTemplate>
    );
}
