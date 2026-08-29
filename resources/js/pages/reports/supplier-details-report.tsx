import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    company_name: string;
    mail?: string | null;
    tel_no?: string | null;
    contact_person_name?: string | null;
}

export default function SupplierDetailsReport() {
    const { t } = useTranslation();
    const { filters, summary, suppliers } = usePage().props as any;

    const [dateFrom, setDateFrom] = useState(filters.dateFrom);
    const [dateTo, setDateTo] = useState(filters.dateTo);
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Reports'), href: '#' },
        { title: t('Supplier Details Report') },
    ];

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('reports.supplier-details'), {
            date_from: dateFrom,
            date_to: dateTo,
            search,
        });
    };

    const handleClearFilters = () => {
        router.get(route('reports.supplier-details'));
    };

    return (
        <PageTemplate
            title={t('Supplier Details Report')}
            description={t('Detailed supplier list with contact information.')}
            url={route('reports.supplier-details')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Card className="mb-6 p-4">
                <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-4">
                    <div>
                        <Label htmlFor="date_from">{t('From Date')}</Label>
                        <Input id="date_from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="date_to">{t('To Date')}</Label>
                        <Input id="date_to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="search">{t('Search')}</Label>
                        <Input
                            id="search"
                            type="text"
                            value={search}
                            placeholder={t('Search company, email, telephone, contact person')}
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

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card className="p-6">
                    <p className="text-sm text-gray-500">{t('Total Suppliers')}</p>
                    <p className="mt-2 text-2xl font-semibold">{summary.total_suppliers.toLocaleString()}</p>
                </Card>
            </div>

            <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">{t('Supplier Details')}</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Company Name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Email')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Telephone')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('Contact Person')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {(suppliers as Supplier[]).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {t('No suppliers found')}
                                    </td>
                                </tr>
                            ) : (
                                (suppliers as Supplier[]).map((supplier) => (
                                    <tr key={supplier.id}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{supplier.company_name}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{supplier.mail || '-'}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{supplier.tel_no || '-'}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{supplier.contact_person_name || '-'}</td>
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
