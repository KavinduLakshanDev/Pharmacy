import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function StockTransferShow() {
  const { t } = useTranslation();
  const { transfer, auth } = usePage().props as any;
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Stock Transfers'), href: route('inventory.stock-transfers.index') },
    { title: transfer.transfer_no },
  ];

  const handleAccept = () => {
    if (confirm(t('Are you sure you want to accept this stock transfer?'))) {
      setIsSubmitting(true);
      router.post(route('inventory.stock-transfers.accept', transfer.id), {}, {
        onSuccess: () => {
          setIsSubmitting(false);
        },
        onError: () => {
          setIsSubmitting(false);
        },
      });
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert(t('Please provide a rejection reason'));
      return;
    }
    if (confirm(t('Are you sure you want to reject this stock transfer?'))) {
      setIsSubmitting(true);
      router.post(route('inventory.stock-transfers.reject', transfer.id), {
        rejection_reason: rejectionReason,
      }, {
        onSuccess: () => {
          setIsSubmitting(false);
          setIsRejecting(false);
          setRejectionReason('');
        },
        onError: () => {
          setIsSubmitting(false);
        },
      });
    }
  };

  return (
    <PageTemplate
      title={t('Stock Transfer')}
      description={t('View stock transfer details')}
      breadcrumbs={breadcrumbs}
      url={`/inventory/stock-transfers/${transfer.id}`}
      actions={[
        {
          label: t('Back'),
          variant: 'outline',
          onClick: () => router.visit(route('inventory.stock-transfers.index')),
        },
      ]}
      noPadding
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Transfer Information')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Transfer No')}</p>
              <p className="text-base font-semibold">{transfer.transfer_no}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('From Branch')}</p>
              <p className="text-base font-semibold">{transfer.from_branch?.name ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('To Branch')}</p>
              <p className="text-base font-semibold">{transfer.to_branch?.name ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Transfer Date')}</p>
              <p className="text-base font-semibold">{transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Status')}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                transfer.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                transfer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                transfer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                transfer.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {t(transfer.status)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Total Amount')}</p>
              <p className="text-base font-semibold">{window.appSettings?.formatCurrency?.(Number(transfer.total_amount ?? 0)) ?? Number(transfer.total_amount ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Created By')}</p>
              <p className="text-base">{transfer.creator?.name ?? '-'}</p>
            </div>
            {transfer.approved_by && (
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Approved By')}</p>
                <p className="text-base">{transfer.approver?.name ?? '-'}</p>
              </div>
            )}
            {transfer.accepted_by && (
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Accepted By')}</p>
                <p className="text-base">{transfer.accepter?.name ?? '-'}</p>
              </div>
            )}
            {transfer.rejected_by && (
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Rejected By')}</p>
                <p className="text-base">{transfer.rejector?.name ?? '-'}</p>
              </div>
            )}
            {transfer.rejection_reason && (
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-gray-500">{t('Rejection Reason')}</p>
                <p className="text-base bg-red-50 p-3 rounded border border-red-200 text-red-800">{transfer.rejection_reason}</p>
              </div>
            )}
            {transfer.notes && (
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-gray-500">{t('Notes')}</p>
                <p className="text-base">{transfer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Product')}</TableHead>
                  <TableHead>{t('SKU')}</TableHead>
                  <TableHead>{t('Quantity')}</TableHead>
                  <TableHead>{t('Unit Cost Price')}</TableHead>
                  <TableHead>{t('Unit Price')}</TableHead>
                  <TableHead>{t('Line Total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfer.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name ?? '-'}</TableCell>
                    <TableCell>{item.product?.sku ?? '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit_cost_price != null ? (window.appSettings?.formatCurrency?.(Number(item.unit_cost_price)) ?? Number(item.unit_cost_price).toFixed(2)) : '-'}</TableCell>
                    <TableCell>{window.appSettings?.formatCurrency?.(Number(item.unit_price ?? 0)) ?? Number(item.unit_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{window.appSettings?.formatCurrency?.(Number(item.total_price ?? 0)) ?? Number(item.total_price ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4">
              <p className="font-semibold text-sm">
                {t('Total')}: {window.appSettings?.formatCurrency?.(Number(transfer.total_amount ?? 0)) ?? Number(transfer.total_amount ?? 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {transfer.status === 'approved' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">{t('Pending Acceptance')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!isRejecting ? (
                <div className="flex gap-3">
                  <Button
                    onClick={handleAccept}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? t('Accepting...') : t('Accept Transfer')}
                  </Button>
                  <Button
                    onClick={() => setIsRejecting(true)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {t('Reject Transfer')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('Rejection Reason')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={t('Please provide a reason for rejecting this transfer')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      rows={4}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReject}
                      disabled={isSubmitting || !rejectionReason.trim()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isSubmitting ? t('Rejecting...') : t('Confirm Rejection')}
                    </Button>
                    <Button
                      onClick={() => {
                        setIsRejecting(false);
                        setRejectionReason('');
                      }}
                      disabled={isSubmitting}
                      variant="outline"
                    >
                      {t('Cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pb-6">
          <Button variant="outline" onClick={() => router.visit(route('inventory.stock-transfers.index'))}>
            {t('Back')}
          </Button>
        </div>
      </div>
    </PageTemplate>
  );
}
