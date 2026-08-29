import { CrudTable } from '@/components/CrudTable';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TableColumn } from '@/types/crud';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StockInHandShow() {
    const { t } = useTranslation();
    const { product, batchNo, branch, summary, transactions = [] } = usePage().props as any;

    const batchLabel = batchNo === '' || batchNo == null ? t('No batch') : String(batchNo);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Stock Bin Card'), href: route('stock-in-hand.index') },
        { title: batchLabel },
    ];

    const formatCurrency = (value: unknown) =>
        window.appSettings?.formatCurrency?.(Number(value || 0)) ?? `$${Number(value || 0).toFixed(2)}`;

    const sourceMap: Record<string, string> = {
        grn: 'GRN',
        production_entry: 'Production',
        usage_note: 'Usage',
        wastage: 'Wastage',
        purchase_order: 'Purchase Order',
        sale: 'Sale',
        sales_order: 'Sales Order',
        receipt_order: 'Receipt Order',
        delivery_order: 'Delivery Order',
        stock_transfer: 'Stock Transfer',
        other: 'Other',
    };

    const columns: TableColumn[] = [
        { key: 'transaction_date', label: t('Date') },
        {
            key: 'transaction_type',
            label: t('Type'),
            render: (value: unknown) =>
                String(value) === 'IN' ? (
                    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3" />
                        {t('IN')}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
                        <TrendingDown className="h-3 w-3" />
                        {t('OUT')}
                    </span>
                ),
        },
        {
            key: 'source_type',
            label: t('Source'),
            render: (value: unknown) => sourceMap[String(value)] ?? String(value),
        },
        { key: 'reference_number', label: t('Reference') },
        {
            key: 'quantity',
            label: t('Qty'),
            render: (_value: unknown, row: Record<string, unknown>) => {
                const units = row.units != null ? Number(row.units) : Number(row.quantity);
                return <span className="font-medium">{units}</span>;
            },
        },
        { key: 'unit_price', label: t('Unit Price'), render: (v) => formatCurrency(v) },
        { key: 'total_amount', label: t('Total'), render: (v) => formatCurrency(v) },
        {
            key: 'previous_stock',
            label: t('Stock Before'),
            render: (_value: unknown, row: Record<string, unknown>) => {
                const units = row.previous_units != null ? Number(row.previous_units) : Number(row.previous_stock);
                return <span>{units}</span>;
            },
        },
        {
            key: 'current_stock',
            label: t('Stock After'),
            render: (_value: unknown, row: Record<string, unknown>) => {
                const units = row.current_units != null ? Number(row.current_units) : Number(row.current_stock);
                return <span>{units}</span>;
            },
        },
    ];

    return (
        <PageTemplate
            title={batchNo}
            description={`${product.name} (${product.sku})`}
            url="/stock-in-hand"
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Back to Stock In Hand'),
                    icon: <ArrowLeft className="h-4 w-4 mr-2" />,
                    variant: 'outline',
                    onClick: () => router.get(route('stock-in-hand.index'), branch ? { branch_id: branch.id } : {}),
                },
            ]}
        >
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-medium text-gray-500">{t('Product')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.sku}</p>
                        </CardContent>
                    </Card>

                    {branch && (
                        <Card>
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-medium text-gray-500">{t('Branch')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-semibold">{branch.name}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-medium text-gray-500">{t('Batch No')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="inline-flex items-center rounded px-2.5 py-1 text-sm font-semibold bg-blue-100 text-blue-800">
                                {batchLabel}
                            </span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                {t('Total In')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-700">
                                {summary.units_in ?? summary.qty_in}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                <TrendingDown className="h-3 w-3 text-red-500" />
                                {t('Total Out')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-600">
                                {summary.units_out ?? summary.qty_out}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-medium text-gray-500">{t('Stock In Hand')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold ${(summary.units_in_hand ?? summary.stock_in_hand) <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {summary.units_in_hand ?? summary.stock_in_hand}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <div className="border-b p-4 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('Transaction History')}</h3>
                    </div>
                    <CrudTable
                        columns={columns}
                        actions={[]}
                        data={transactions}
                        from={1}
                        onAction={() => undefined}
                        permissions={[]}
                    />
                </div>
            </div>
        </PageTemplate>
    );
}
