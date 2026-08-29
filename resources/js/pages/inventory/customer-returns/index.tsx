import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Branch {
    id: number;
    name: string;
}

interface CustomerReturnRow {
    id: number;
    return_number: string;
    return_date: string;
    total_amount: number;
    invoice_return_credit?: number | string | null;
    exchange_purchase_amount?: number | string | null;
    customer_additional_payment_due?: number | string | null;
    customer_credit_after_exchange?: number | string | null;
    branch?: { id: number; name: string } | null;
    customer?: {
        name: string;
        code: string | null;
        phone: string | null;
    } | null;
    grn?: {
        invoice_no: string | null;
        grn_no: string;
    } | null;
    sales_transaction?: {
        sale_no: string;
        sale_date: string;
    } | null;
}

interface CustomerReturnPaginator {
    data: CustomerReturnRow[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number;
    to: number;
    total: number;
}

export default function CustomerReturnsPage() {
    const { customerReturns, branches = [], filters = {} } = usePage<{
        customerReturns?: CustomerReturnPaginator;
        branches: Branch[];
        filters: Record<string, string>;
    }>().props;
    const { t: translate } = useTranslation();
    const pageActions = [
        {
            label: translate('Add Customer Return'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: () => router.visit(route('inventory.customer-returns.create')),
        },
    ];

    const formatDate = (value: string): string => value.split('T')[0] ?? value;

    const handleBranchFilter = (value: string) => {
        router.get(
            route('inventory.customer-returns.index'),
            { ...filters, branch_id: value === 'all' ? undefined : value },
            { preserveState: true, replace: true },
        );
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Inventory'), href: route('inventory.dashboard') },
        { title: translate('Customer Returns') },
    ];

    return (
        <PageTemplate
            title={translate('Customer Returns')}
            description={`${translate('Review customer returns matched to the sale invoice, including additional catalog lines when recorded.')} ${translate('')}`}
            url="/inventory/customer-returns"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{translate('Customer Return History')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex items-center gap-3">
                            <Select value={filters.branch_id ?? 'all'} onValueChange={handleBranchFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={translate('All Branches')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{translate('All Branches')}</SelectItem>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {customerReturns?.data?.length ? (
                            <div className="space-y-4">
                                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">{translate('Return No')}</th>
                                                <th className="px-4 py-3 text-left font-semibold">{translate('Branch')}</th>
                                                <th className="px-4 py-3 text-left font-semibold">{translate('Customer')}</th>
                                                <th className="px-4 py-3 text-left font-semibold">
                                                    {translate('Sale invoice number')}
                                                </th>
                                                <th className="px-4 py-3 text-right font-semibold">{translate('Return Date')}</th>
                                                <th className="px-4 py-3 text-right font-semibold">{translate('Stock in (return)')}</th>
                                                <th className="px-4 py-3 text-right font-semibold">{translate('Stock out (exchange)')}</th>
                                                <th className="px-4 py-3 text-right font-semibold">{translate('Line total')}</th>
                                                <th className="px-4 py-3 text-right font-semibold">{translate('Customer settlement')}</th>
                                                <th className="px-4 py-3 text-right font-semibold">{translate('Actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {customerReturns.data.map((customerReturn) => (
                                                    <tr key={customerReturn.id}>
                                                    <td className="whitespace-nowrap px-4 py-3 font-medium">{customerReturn.return_number}</td>
                                                    <td className="whitespace-nowrap px-4 py-3">{customerReturn.branch?.name ?? '-'}</td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <div className="font-medium">{customerReturn.customer?.name ?? '-'}</div>
                                                        {(customerReturn.customer?.code || customerReturn.customer?.phone) && (
                                                            <div className="text-xs text-gray-500">
                                                                {[customerReturn.customer?.code, customerReturn.customer?.phone].filter(Boolean).join(' · ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {customerReturn.sales_transaction?.sale_no?.trim()
                                                            ? customerReturn.sales_transaction.sale_no
                                                            : customerReturn.grn?.invoice_no?.trim()
                                                              ? customerReturn.grn.invoice_no
                                                              : '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right align-top tabular-nums">
                                                        {formatDate(customerReturn.return_date)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right align-top tabular-nums text-emerald-800">
                                                        {Number(customerReturn.invoice_return_credit ?? 0).toFixed(2)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right align-top tabular-nums text-red-700">
                                                        {Number(customerReturn.exchange_purchase_amount ?? 0).toFixed(2)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right align-top tabular-nums">
                                                        {Number(customerReturn.total_amount).toFixed(2)}
                                                    </td>
                                                    <td className="max-w-[10rem] px-4 py-3 text-right align-top text-xs">
                                                        {Number(customerReturn.customer_additional_payment_due ?? 0) >= 0.005 ? (
                                                            <span className="font-medium text-amber-900">
                                                                {translate('Due')}{' '}
                                                                {Number(
                                                                    customerReturn.customer_additional_payment_due,
                                                                ).toFixed(2)}
                                                            </span>
                                                        ) : Number(customerReturn.customer_credit_after_exchange ?? 0) >=
                                                          0.005 ? (
                                                            <span className="font-medium text-emerald-900">
                                                                {translate('Credit')}{' '}
                                                                {Number(
                                                                    customerReturn.customer_credit_after_exchange,
                                                                ).toFixed(2)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">−</span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                router.visit(
                                                                    route('inventory.customer-returns.show', customerReturn.id),
                                                                )
                                                            }
                                                        >
                                                            {translate('View')}
                                                        </Button>
                                                    </td>
                                                    </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination
                                    from={customerReturns.from}
                                    to={customerReturns.to}
                                    total={customerReturns.total}
                                    links={customerReturns.links}
                                    entityName={translate('Customer Returns').toLowerCase()}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">{translate('No customer returns found')}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
