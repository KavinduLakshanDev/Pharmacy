import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SupplierPaymentReceipt() {
    const { t } = useTranslation();
    const { payment } = usePage().props as any;

    const formatMoney = (value: number) => {
        const amount = Number.isFinite(value) ? value : 0;
        return window.appSettings?.formatCurrency?.(amount) || `Rs. ${amount.toFixed(2)}`;
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Supplier Payments'), href: route('inventory.supplier-payments.index') },
        { title: t('Receipt') },
    ];

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            cash: t('Cash'),
            cheque: t('Cheque'),
            bank: t('Bank Transfer'),
            bank_transfer: t('Bank Transfer'),
        };
        return labels[method] || method;
    };

    return (
        <PageTemplate
            title={t('Supplier Payment Receipt')}
            description={t('View payment receipt details')}
            url="/inventory/supplier-payments/receipt"
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">{t('Payment Receipt')}</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {t('Payment Date')}: {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '—'}
                        </p>
                    </div>

                    {/* Payment Details */}
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Supplier')}</p>
                                <p className="font-medium">{payment.supplier?.company_name || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Payment Method')}</p>
                                <p className="font-medium">{getPaymentMethodLabel(payment.payment_method)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Amount')}</p>
                                <p className="text-2xl font-bold text-green-600">{formatMoney(payment.paid_amount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Bank Account')}</p>
                                <p className="font-medium">{payment.bankAccount?.name || '—'}</p>
                            </div>
                        </div>

                        {payment.notes && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Notes')}</p>
                                <p className="font-medium">{payment.notes}</p>
                            </div>
                        )}

                        {/* Cheque Details */}
                        {payment.payment_method === 'cheque' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('Cheque Details')}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {payment.cheque_no && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Cheque No')}</p>
                                            <p className="font-medium">{payment.cheque_no}</p>
                                        </div>
                                    )}
                                    {payment.cheque_bank_name && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Bank Name')}</p>
                                            <p className="font-medium">{payment.cheque_bank_name}</p>
                                        </div>
                                    )}
                                    {payment.cheque_branch && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Branch')}</p>
                                            <p className="font-medium">{payment.cheque_branch}</p>
                                        </div>
                                    )}
                                    {payment.cheque_date && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Cheque Date')}</p>
                                            <p className="font-medium">{new Date(payment.cheque_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bank Transfer Details */}
                        {(payment.payment_method === 'bank' || payment.payment_method === 'bank_transfer') && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('Bank Transfer Details')}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {payment.bank_reference_no && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Reference No')}</p>
                                            <p className="font-medium">{payment.bank_reference_no}</p>
                                        </div>
                                    )}
                                    {payment.bank_name && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Bank Name')}</p>
                                            <p className="font-medium">{payment.bank_name}</p>
                                        </div>
                                    )}
                                    {payment.bank_branch && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Branch')}</p>
                                            <p className="font-medium">{payment.bank_branch}</p>
                                        </div>
                                    )}
                                    {payment.bank_deposit_date && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Deposit Date')}</p>
                                            <p className="font-medium">{new Date(payment.bank_deposit_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    {payment.bank_account_no && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Account No')}</p>
                                            <p className="font-medium">{payment.bank_account_no}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Transfer Details */}
                        {payment.payment_method === 'transfer' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('Transfer Details')}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {payment.transfer_reference_no && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Reference No')}</p>
                                            <p className="font-medium">{payment.transfer_reference_no}</p>
                                        </div>
                                    )}
                                    {payment.transfer_transaction_id && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Transaction ID')}</p>
                                            <p className="font-medium">{payment.transfer_transaction_id}</p>
                                        </div>
                                    )}
                                    {payment.transfer_bank_name && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Bank Name')}</p>
                                            <p className="font-medium">{payment.transfer_bank_name}</p>
                                        </div>
                                    )}
                                    {payment.transfer_branch && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Branch')}</p>
                                            <p className="font-medium">{payment.transfer_branch}</p>
                                        </div>
                                    )}
                                    {payment.transfer_date && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Transfer Date')}</p>
                                            <p className="font-medium">{new Date(payment.transfer_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route('inventory.supplier-payments.index'))}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('Back to Payments')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            {t('Print')}
                        </Button>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
