import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, usePage } from '@inertiajs/react';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface CustomerReturnItemRow {
    id: number;
    sales_transaction_item_id: number | null;
    product_id: number;
    quantity: number | string;
    unit_price: number | string;
    total_price: number | string;
    batch_no: string | null;
    expiry_date: string | null;
    product?: {
        id: number;
        name: string;
        sku: string | null;
    } | null;
}

interface CustomerReturnDetail {
    id: number;
    return_number: string;
    return_date: string;
    notes: string | null;
    total_amount: number;
    invoice_return_credit?: number | string | null;
    exchange_purchase_amount?: number | string | null;
    customer_additional_payment_due?: number | string | null;
    customer_credit_after_exchange?: number | string | null;
    items?: CustomerReturnItemRow[];
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

export default function CustomerReturnShowPage() {
    const { customerReturn } = usePage<{ customerReturn: CustomerReturnDetail }>().props;
    const { t: translate } = useTranslation();

    const items = customerReturn.items ?? [];
    const returnedLineItems = useMemo(
        () => items.filter((row) => row.sales_transaction_item_id != null),
        [items],
    );

    const exchangeLineItems = useMemo(
        () => items.filter((row) => row.sales_transaction_item_id == null),
        [items],
    );

    const invoiceLineBatchCountsByProduct = useMemo(() => {
        const m = new Map<number, number>();
        for (const row of items) {
            if (row.sales_transaction_item_id == null) {
                continue;
            }
            m.set(row.product_id, (m.get(row.product_id) ?? 0) + 1);
        }

        return m;
    }, [items]);

    const firstInvoiceLineIndexByProduct = useMemo(() => {
        const m = new Map<number, number>();
        items.forEach((item, idx) => {
            if (item.sales_transaction_item_id == null) {
                return;
            }
            if (!m.has(item.product_id)) {
                m.set(item.product_id, idx);
            }
        });

        return m;
    }, [items]);

    const formatDate = (value: string | null | undefined): string => {
        if (!value) {
            return '—';
        }

        return value.split('T')[0] ?? value;
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Inventory'), href: route('inventory.dashboard') },
        { title: translate('Customer Returns'), href: route('inventory.customer-returns.index') },
        { title: customerReturn.return_number },
    ];

    const invoiceLabel = customerReturn.sales_transaction?.sale_no?.trim()
        ? customerReturn.sales_transaction.sale_no
        : customerReturn.grn?.invoice_no?.trim()
          ? customerReturn.grn.invoice_no
          : '—';

    return (
        <PageTemplate
            title={translate('Customer Return')}
            description={translate(
                'View return details, returned invoice lines (with batch and expiry per sale line), and any exchange products.',
            )}
            breadcrumbs={breadcrumbs}
            url={`/inventory/customer-returns/${customerReturn.id}`}
            actions={[
                {
                    label: translate('Back'),
                    variant: 'outline',
                    onClick: () => router.visit(route('inventory.customer-returns.index')),
                },
            ]}
            noPadding
        >
            <div className="mx-auto max-w-6xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{translate('Return information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{translate('Return No')}</p>
                            <p className="text-base font-semibold">{customerReturn.return_number}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{translate('Branch')}</p>
                            <p className="text-base font-semibold">{customerReturn.branch?.name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{translate('Return Date')}</p>
                            <p className="text-base font-semibold">{formatDate(customerReturn.return_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{translate('Customer')}</p>
                            <p className="text-base font-semibold">{customerReturn.customer?.name ?? '—'}</p>
                            {(customerReturn.customer?.code || customerReturn.customer?.phone) && (
                                <p className="text-sm text-gray-500">
                                    {[customerReturn.customer?.code, customerReturn.customer?.phone].filter(Boolean).join(' · ')}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{translate('Sale invoice number')}</p>
                            <p className="text-base font-semibold">{invoiceLabel}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{translate('Stock valuation')}</p>
                            <p className="text-base font-semibold tabular-nums">{Number(customerReturn.total_amount).toFixed(2)}</p>
                        </div>
                        <div className="md:col-span-3">
                            <p className="text-sm font-medium text-gray-500">{translate('Customer settlement')}</p>
                            <p className="text-base font-semibold">
                                {Number(customerReturn.customer_additional_payment_due ?? 0) >= 0.005 ? (
                                    <span className="text-amber-900">
                                        {translate('Due')} {Number(customerReturn.customer_additional_payment_due).toFixed(2)}
                                    </span>
                                ) : Number(customerReturn.customer_credit_after_exchange ?? 0) >= 0.005 ? (
                                    <span className="text-emerald-900">
                                        {translate('Credit')} {Number(customerReturn.customer_credit_after_exchange).toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-slate-400">—</span>
                                )}
                            </p>
                            {(Number(customerReturn.invoice_return_credit ?? 0) >= 0.005 ||
                                Number(customerReturn.exchange_purchase_amount ?? 0) >= 0.005) && (
                                <p className="mt-1 text-xs text-gray-500">
                                    {translate('Invoice credit')}: {Number(customerReturn.invoice_return_credit ?? 0).toFixed(2)}
                                    {' · '}
                                    {translate('Exchange total')}: {Number(customerReturn.exchange_purchase_amount ?? 0).toFixed(2)}
                                </p>
                            )}
                        </div>
                        {customerReturn.notes ? (
                            <div className="md:col-span-3">
                                <p className="text-sm font-medium text-gray-500">{translate('Notes')}</p>
                                <p className="text-base whitespace-pre-wrap">{customerReturn.notes}</p>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-wrap items-center gap-2">
                            <span>{translate('Returned products')}</span>
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                {translate('Stock in')}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{translate('Product')}</TableHead>
                                    <TableHead>{translate('SKU')}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                        {translate('Batch No')}
                                    </TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                        {translate('Expiry')}
                                    </TableHead>
                                    <TableHead>{translate('Quantity')}</TableHead>
                                    <TableHead>{translate('Unit Price')}</TableHead>
                                    <TableHead>{translate('Line Total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returnedLineItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                                            {translate('No returned invoice lines')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    returnedLineItems.flatMap((item, idx) => {
                                        const batchCountForProduct = returnedLineItems.filter(
                                            (r) => r.product_id === item.product_id,
                                        ).length;
                                        const firstIdxForProduct = returnedLineItems.findIndex(
                                            (r) => r.product_id === item.product_id,
                                        );
                                        const chunk: ReactNode[] = [];

                                        if (batchCountForProduct > 1 && firstIdxForProduct === idx) {
                                            chunk.push(
                                                <TableRow key={`batch-group-${item.product_id}-${idx}`} className="bg-gray-50/90">
                                                    <TableCell
                                                        colSpan={7}
                                                        className="py-2.5 text-xs font-bold uppercase tracking-wide text-gray-600"
                                                    >
                                                        {item.product?.name ?? '—'}
                                                        <span className="font-normal normal-case text-gray-500">
                                                            {' '}
                                                            — {batchCountForProduct} {translate('batches on this invoice')}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>,
                                            );
                                        }

                                        chunk.push(
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.product?.name ?? '—'}</TableCell>
                                                <TableCell>{item.product?.sku ?? '—'}</TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-gray-800">
                                                        {item.batch_no?.trim() || '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-bold text-orange-600">
                                                    {formatDate(item.expiry_date ?? undefined)}
                                                </TableCell>
                                                <TableCell className="tabular-nums">
                                                    {Number(item.quantity).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="tabular-nums">{Number(item.unit_price).toFixed(2)}</TableCell>
                                                <TableCell className="tabular-nums">{Number(item.total_price).toFixed(2)}</TableCell>
                                            </TableRow>,
                                        );

                                        return chunk;
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-wrap items-center gap-2">
                            <span>{translate('Replacement / exchange')}</span>
                            <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                {translate('Stock out')}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{translate('Product')}</TableHead>
                                    <TableHead>{translate('SKU')}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                        {translate('Batch No')}
                                    </TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                        {translate('Expiry')}
                                    </TableHead>
                                    <TableHead>{translate('Quantity')}</TableHead>
                                    <TableHead>{translate('Unit Price')}</TableHead>
                                    <TableHead>{translate('Line Total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exchangeLineItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                                            {translate('No exchange lines')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exchangeLineItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.product?.name ?? '—'}</TableCell>
                                            <TableCell>{item.product?.sku ?? '—'}</TableCell>
                                            <TableCell>
                                                <span className="font-bold text-gray-800">
                                                    {item.batch_no?.trim() || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-bold text-orange-600">
                                                {formatDate(item.expiry_date ?? undefined)}
                                            </TableCell>
                                            <TableCell className="tabular-nums">
                                                {Number(item.quantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="tabular-nums">{Number(item.unit_price).toFixed(2)}</TableCell>
                                            <TableCell className="tabular-nums">{Number(item.total_price).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{translate('Exchange Lines')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{translate('Product')}</TableHead>
                                    <TableHead>{translate('SKU')}</TableHead>
                                    <TableHead>{translate('Batch')}</TableHead>
                                    <TableHead>{translate('Expiry')}</TableHead>
                                    <TableHead>{translate('Quantity')}</TableHead>
                                    <TableHead>{translate('Unit Price')}</TableHead>
                                    <TableHead>{translate('Line Total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exchangeLineItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                                            {translate('No exchange lines')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exchangeLineItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.product?.name ?? '—'}</TableCell>
                                            <TableCell>{item.product?.sku ?? '—'}</TableCell>
                                            <TableCell>
                                                <span className="font-bold text-gray-800">
                                                    {item.batch_no?.trim() || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-bold text-orange-600">
                                                {formatDate(item.expiry_date ?? undefined)}
                                            </TableCell>
                                            <TableCell className="tabular-nums">
                                                {Number(item.quantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="tabular-nums">{Number(item.unit_price).toFixed(2)}</TableCell>
                                            <TableCell className="tabular-nums">{Number(item.total_price).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
