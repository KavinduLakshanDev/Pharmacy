import { PageTemplate } from '@/components/page-template';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

type ReportFilters = {
    dateFrom: string;
    dateTo: string;
    branchId: string;
    productId: string;
    transferNo: string;
    batchNo: string;
};

type ReportItem = {
    transfer_id: number;
    transfer_no: string;
    transfer_date: string;
    product_id: number;
    product_name: string;
    batch_no?: string | null;
    quantity: number;
    unit_cost_price: number;
    total_cost: number;
    from_branch_name: string;
    to_branch_name: string;
};

export default function ApprovedStockTransferReport() {
    const { t } = useTranslation();
    const { filters, branches, products, items, summary } = usePage().props as any;

    const [dateFrom, setDateFrom] = useState((filters as ReportFilters).dateFrom);
    const [dateTo, setDateTo] = useState((filters as ReportFilters).dateTo);
    const [branchId, setBranchId] = useState((filters as ReportFilters).branchId ?? 'all');
    const [productId, setProductId] = useState((filters as ReportFilters).productId ?? 'all');
    const [transferNo, setTransferNo] = useState((filters as ReportFilters).transferNo ?? '');
    const [batchNo, setBatchNo] = useState((filters as ReportFilters).batchNo ?? '');

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Reports'), href: '#' },
        { title: t('Approved Stock Transfers') },
    ];

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('reports.approved-stock-transfers'), {
            date_from: dateFrom,
            date_to: dateTo,
            branch_id: branchId !== 'all' ? branchId : undefined,
            product_id: productId !== 'all' ? productId : undefined,
            transfer_no: transferNo || undefined,
            batch_no: batchNo || undefined,
        });
    };

    const handleClearFilters = () => {
        router.get(route('reports.approved-stock-transfers'));
    };

    const formatCurrency = (amount: number) => {
        return window.appSettings?.formatCurrency(amount) || amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    return (
        <PageTemplate
            title={t('Approved Stock Transfers')}
            description={t('Stock transfers that are approved and awaiting acceptance.')}
            url={route('reports.approved-stock-transfers')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Card className="mb-6 p-4">
                <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-7">
                    <div>
                        <Label htmlFor="date_from">{t('From Date')}</Label>
                        <Input id="date_from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="date_to">{t('To Date')}</Label>
                        <Input id="date_to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="branch_id">{t('Branch')}</Label>
                        <Select value={branchId} onValueChange={(value) => setBranchId(value)}>
                            <SelectTrigger id="branch_id">
                                <SelectValue placeholder={t('All branches')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All')}</SelectItem>
                                {(branches as any[]).map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="product_id">{t('Product')}</Label>
                        <Select value={productId} onValueChange={(value) => setProductId(value)}>
                            <SelectTrigger id="product_id">
                                <SelectValue placeholder={t('All products')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All')}</SelectItem>
                                {(products as any[]).map((product) => (
                                    <SelectItem key={product.id} value={String(product.id)}>
                                        {product.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="transfer_no">{t('Transfer No')}</Label>
                        <Input
                            id="transfer_no"
                            type="text"
                            value={transferNo}
                            placeholder={t('Transfer no')}
                            onChange={(event) => setTransferNo(event.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="batch_no">{t('Batch')}</Label>
                        <Input
                            id="batch_no"
                            type="text"
                            value={batchNo}
                            placeholder={t('Batch no')}
                            onChange={(event) => setBatchNo(event.target.value)}
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

            <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Approved Stock Transfers')}</h2>
                    <div className="text-sm text-gray-500">
                        {t('Items')}: {Number(summary?.total_items ?? 0).toLocaleString()} | {t('Qty')}: {Number(summary?.total_quantity ?? 0).toLocaleString()} | {t('Total Cost')}: {formatCurrency(Number(summary?.total_cost ?? 0))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Transfer No')}</TableHead>
                                <TableHead>{t('Date')}</TableHead>
                                <TableHead>{t('Product')}</TableHead>
                                <TableHead>{t('Batch')}</TableHead>
                                <TableHead className="text-right">{t('Qty')}</TableHead>
                                <TableHead className="text-right">{t('Unit Cost')}</TableHead>
                                <TableHead className="text-right">{t('Total')}</TableHead>
                                <TableHead>{t('From Branch')}</TableHead>
                                <TableHead>{t('To Branch')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(items as ReportItem[]).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        {t('No approved stock transfers found')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (items as ReportItem[]).map((item) => (
                                    <TableRow key={`${item.transfer_id}-${item.product_id}-${item.batch_no ?? 'none'}`}>
                                        <TableCell className="font-medium">{item.transfer_no}</TableCell>
                                        <TableCell>{item.transfer_date}</TableCell>
                                        <TableCell>{item.product_name}</TableCell>
                                        <TableCell>{item.batch_no ?? '-'}</TableCell>
                                        <TableCell className="text-right">{Number(item.quantity).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Number(item.unit_cost_price))}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Number(item.total_cost))}</TableCell>
                                        <TableCell>{item.from_branch_name}</TableCell>
                                        <TableCell>{item.to_branch_name}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </PageTemplate>
    );
}
