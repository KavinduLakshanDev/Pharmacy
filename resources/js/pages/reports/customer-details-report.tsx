import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageTemplate } from '@/components/page-template';
import { router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function CustomerDetailsReport() {
  const { t } = useTranslation();
  const { filters, summary, customers } = usePage().props as any;

  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);
  const [type, setType] = useState(filters.type || 'all');
  const [search, setSearch] = useState(filters.search || '');

  const getTypeLabel = (customerType: string) => {
    if (customerType === 'shop') {
      return t('Shop');
    }

    if (customerType === 'privileged_customer') {
      return t('Privileged Customer');
    }

    return t('Customer');
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Reports'), href: '#' },
    { title: t('Customer Details Report') },
  ];

  const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params: Record<string, string> = {
      date_from: dateFrom,
      date_to: dateTo,
      search,
    };

    if (type !== 'all') {
      params.type = type;
    }

    router.get(route('reports.customer-details'), params);
  };

  const handleClearFilters = () => {
    const defaultDateFrom = new Date();
    defaultDateFrom.setMonth(defaultDateFrom.getMonth() - 1);
    const defaultDateTo = new Date();

    setDateFrom(defaultDateFrom.toISOString().split('T')[0]);
    setDateTo(defaultDateTo.toISOString().split('T')[0]);
    setType('all');
    setSearch('');

    router.get(route('reports.customer-details'));
  };

  return (
    <PageTemplate title={t('Customer Details Report')} description={t('Detailed customer list with shop and contact data.')} url={route('reports.customer-details')}
      breadcrumbs={breadcrumbs} noPadding>
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

          <div>
            <Label htmlFor="type">{t('Type')}</Label>
            <Select value={type} onValueChange={(value) => setType(value)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder={t('All Types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Types')}</SelectItem>
                <SelectItem value="customer">{t('Customer')}</SelectItem>
                <SelectItem value="privileged_customer">{t('Privileged Customer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="search">{t('Search')}</Label>
            <Input
              id="search"
              type="text"
              value={search}
              placeholder={t('Search name, code, email, phone, privileged number')}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Button type="submit">{t('Apply Filters')}</Button>
            <Button type="button" variant="outline" onClick={handleClearFilters}>{t('Clear Filters')}</Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('Total Customers')}</p>
          <p className="mt-2 text-2xl font-semibold">{summary.total_customers.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('Customers')}</p>
          <p className="mt-2 text-2xl font-semibold">{summary.customer_count.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('Privileged Customers')}</p>
          <p className="mt-2 text-2xl font-semibold">{summary.privileged_customer_count.toLocaleString()}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('Customer Details')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Code')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Privileged Number')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Type')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">{t('No customers found')}</td>
                </tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.code || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.privileged_customer_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTypeLabel(customer.type || '')}</td>
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
