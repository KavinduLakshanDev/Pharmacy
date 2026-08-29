import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    company_name: string;
    contact_person_name?: string | null;
}

interface LedgerEntry {
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

export default function SupplierLedgerCard() {
    const { t } = useTranslation();
    const { filters, suppliers, summary, ledgerEntries } = usePage().props as any;

    const [dateFrom, setDateFrom] = useState(filters.dateFrom);
    const [dateTo, setDateTo] = useState(filters.dateTo);
    const [supplierId, setSupplierId] = useState(filters.supplierId ? String(filters.supplierId) : 'all');

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Reports'), href: '#' },
        { title: t('Supplier Ledger Card') },
    ];

    const formatCurrency = (amount: number) => {
        return window.appSettings?.formatCurrency(amount) || amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const params: Record<string, string> = {
            date_from: dateFrom,
            date_to: dateTo,
        };

        if (supplierId !== 'all') {
            params.supplier_id = supplierId;
        }

        router.get(route('reports.supplier-ledger-card'), params);
    };

    const handleClearFilters = () => {
        router.get(route('reports.supplier-ledger-card'));
    };

    return (
        <PageTemplate
            title={t('Supplier Ledger Card')}
            description={t('Track supplier purchases, payments, returns, and running balance.')}
            url={route('reports.supplier-ledger-card')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Card className="mb-6 p-4">
                <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-5">
                    <div>
                        <Label htmlFor="date_from">{t('From Date')}</Label>
                        <Input id="date_from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="date_to">{t('To Date')}</Label>
                        <Input id="date_to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    </div>

                    <div className="lg:col-span-2">
                        <Label htmlFor="supplier_id">{t('Supplier')}</Label>
                        <SearchableSelect
                            value={supplierId}
                            onValueChange={(value) => setSupplierId(value)}
                            options={[
                                { value: 'all', label: t('All Suppliers') },
                                ...(suppliers as Supplier[]).map((supplier) => ({
                                    value: String(supplier.id),
                                    label: supplier.company_name,
                                })),
                            ]}
                            placeholder={t('Search supplier')}
                            noOptionsText={t('No suppliers found')}
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

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Opening Balance')}</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.opening_balance)}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Total Debit')}</p>
                    <p className="mt-2 text-2xl font-semibold text-red-600">{formatCurrency(summary.total_debits)}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Total Credit')}</p>
                    <p className="mt-2 text-2xl font-semibold text-green-600">{formatCurrency(summary.total_credits)}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Closing Balance')}</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.closing_balance)}</p>
                </Card>
            </div>

            <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Ledger Entries')}</h2>
                    <Button type="button" variant="outline" onClick={() => window.print()}>
                        {t('Print')}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Date')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Reference')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Description')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Debit')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Credit')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('Balance')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {(ledgerEntries as LedgerEntry[]).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {t('No ledger entries found')}
                                    </td>
                                </tr>
                            ) : (
                                (ledgerEntries as LedgerEntry[]).map((entry, index) => (
                                    <tr key={`${entry.reference}-${index}`}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{entry.date}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{entry.reference}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{entry.description}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-red-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(entry.balance)}</td>
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
