import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTemplate } from '@/components/page-template';
import SearchableSelect from '@/components/ui/searchable-select';
import { router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function CustomerOutstandingReport() {
  const { t } = useTranslation();
  const { filters, summary, customers, customerOptions } = usePage().props as any;

  const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
  const [customerType, setCustomerType] = useState(filters.customer_type || 'all');
  const [customerId, setCustomerId] = useState(filters.customer_id ? String(filters.customer_id) : 'all');
  const [perPage, setPerPage] = useState(filters.per_page || 10);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Reports'), href: '#' },
    { title: t('Customer Outstanding Report') },
  ];

  const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params: Record<string, any> = {
      date,
      per_page: perPage,
    };

    if (customerType && customerType !== 'all') params.customer_type = customerType;
    if (customerId !== 'all') params.customer_id = customerId;

    router.get(route('reports.customer-outstanding'), params);
  };

  const handleClearFilters = () => {
    const defaultDate = new Date();
    setDate(defaultDate.toISOString().split('T')[0]);
    setCustomerType('all');
    setCustomerId('all');
    setPerPage(10);

    router.get(route('reports.customer-outstanding'));
  };

  return (
    <PageTemplate title={t('Customer Outstanding Report')} description={t('Aging and outstanding balances by customer.')} url={route('reports.customer-outstanding')} breadcrumbs={breadcrumbs} noPadding>
      <Card className="mb-6 p-4">
        <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-4">
          <div>
            <Label htmlFor="date">{t('Date')}</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="customer_type">{t('Customer Type')}</Label>
            <SearchableSelect
              value={customerType}
              onValueChange={(value) => {
                setCustomerType(value);
                setCustomerId('all');
              }}
              options={[
                { value: 'all', label: t('All Customer Types') },
                { value: 'customer', label: t('Customer') },
                { value: 'privileged_customer', label: t('Privileged Customer') },
              ]}
              placeholder={t('All Customer Types')}
              noOptionsText={t('No customer types found')}
            />
          </div>

          <div>
            <Label htmlFor="customer_id">{t('Customer')}</Label>
            <SearchableSelect
              value={customerId}
              onValueChange={(value) => setCustomerId(value)}
              options={[
                { value: 'all', label: t('All Customers') },
                ...(customerOptions || []),
              ]}
              placeholder={t('Search customer code or name')}
              noOptionsText={t('No customers found')}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="per_page">{t('Per Page')}</Label>
            <Input id="per_page" type="number" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} />
            <div className="flex gap-2 mt-2">
              <Button type="submit">{t('Apply Filters')}</Button>
              <Button type="button" variant="outline" onClick={handleClearFilters}>{t('Clear')}</Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-5">
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('Total Outstanding')}</p>
          <p className="mt-2 text-2xl font-semibold">{(summary.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('<30 Days')}</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">{(summary.buckets?.['0_30'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('30-60 Days')}</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">{(summary.buckets?.['30_60'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('61-90 Days')}</p>
          <p className="mt-2 text-2xl font-semibold text-orange-600">{(summary.buckets?.['61_90'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('>90 Days')}</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{(summary.buckets?.gt_90 || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('Customer Outstanding')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Customer Code/ID')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Customer Name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('< 30 DAYS')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('30-60 DAYS')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('61-90 DAYS')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('> 90 DAYS')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Total Outstanding')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">{t('No records found')}</td>
                </tr>
              ) : (
                customers.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.code || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{(c.buckets?.['0_30'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{(c.buckets?.['30_60'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{(c.buckets?.['61_90'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{(c.buckets?.gt_90 || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{(c.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {typeof c.id === 'number' ? (
                        <a href={route('customers.show', { customer: c.id })}>{t('View')}</a>
                      ) : (
                        <span className="text-gray-400">{t('View')}</span>
                      )}
                    </td>
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
