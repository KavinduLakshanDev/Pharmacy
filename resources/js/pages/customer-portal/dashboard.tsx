import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import { ShoppingCart, CreditCard, User, ArrowRight, AlertCircle, FileText, Clock, Loader2, CheckCircle } from 'lucide-react';
import CustomerPortalLayout from '@/layouts/customer-portal-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Customer {
    id: number;
    name: string;
    code: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    current_balance: string;
}

interface SaleItem {
    id: number;
    product: { id: number; name: string; sku: string } | null;
}

interface Sale {
    id: number;
    sale_no: string;
    sale_date: string;
    total_amount: string;
    paid_amount: string;
    balance_amount: string;
    status: string;
}

interface Payment {
    id: number;
    payment_date: string;
    paid_amount: string;
    payment_method: string;
    notes: string | null;
}

interface Prescription {
    id: number;
    status: 'pending' | 'processing' | 'ready';
    staff_message: string | null;
    created_at: string;
}

interface DashboardProps {
    customer: Customer | null;
    recentSales: Sale[];
    recentPayments: Payment[];
    recentPrescriptions: Prescription[];
}

const PRESCRIPTION_STATUS: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 dark:text-yellow-400' },
    processing: { label: 'Processing', icon: Loader2, color: 'text-blue-600 dark:text-blue-400' },
    ready: { label: 'Ready for Pickup', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
};

export default function CustomerDashboard({ customer, recentSales, recentPayments, recentPrescriptions }: DashboardProps) {
    const { t } = useTranslation();

    const formatCurrency = (value: string | number) => {
        return Number(value).toFixed(2);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            pending: 'secondary',
            cancelled: 'destructive',
        };
        return variants[status] ?? 'outline';
    };

    return (
        <CustomerPortalLayout title={t('Dashboard')}>
            <div className="space-y-6">
                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {t('Welcome back')}, {customer?.name ?? t('Customer')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('Here is an overview of your account')}
                    </p>
                </div>

                {!customer && (
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                        <CardContent className="flex items-center gap-3 pt-5">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                {t('Your account is not linked to a customer profile yet. Please update your profile.')}
                            </p>
                            <Link
                                href={route('customer-portal.profile')}
                                className="ml-auto text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
                            >
                                {t('Go to Profile')} <ArrowRight className="inline h-3 w-3" />
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Outstanding Balance')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                        {formatCurrency(customer?.current_balance ?? 0)}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Total Purchases')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                        {recentSales.length > 0 ? recentSales.length : '—'}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Customer Code')}</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                        {customer?.code ?? '—'}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Purchases */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t('Recent Purchases')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentSales.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                                    {t('No purchases found')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {recentSales.map((sale) => (
                                        <div
                                            key={sale.id}
                                            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {sale.sale_no}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {sale.sale_date}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(sale.total_amount)}
                                                </p>
                                                <Badge variant={getStatusBadge(sale.status)} className="text-xs">
                                                    {t(sale.status)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Payments */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t('Recent Payments')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentPayments.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                                    {t('No payments found')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {recentPayments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {t(payment.payment_method ?? 'Payment')}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {payment.payment_date}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                +{formatCurrency(payment.paid_amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Prescriptions */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('My Prescriptions')}
                        </CardTitle>
                        <Link
                            href={route('customer-portal.prescriptions.index')}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            {t('View All')} <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentPrescriptions.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    {t('No prescriptions submitted yet')}
                                </p>
                                <Link
                                    href={route('customer-portal.prescriptions.index')}
                                    className="text-sm text-primary hover:underline font-medium"
                                >
                                    {t('Submit Your First Prescription')}
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentPrescriptions.map((prescription) => {
                                    const config = PRESCRIPTION_STATUS[prescription.status];
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={prescription.id}
                                            className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                        >
                                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${config.color}`}>
                                                    {t(config.label)}
                                                </p>
                                                {prescription.staff_message && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                                                        {prescription.staff_message}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {new Date(prescription.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </CustomerPortalLayout>
    );
}
