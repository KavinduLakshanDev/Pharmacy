import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface FinanceAccount {
    id: number;
    name: string;
    account_type: string;
    status: string;
    description: string | null;
    bank_branch: string | null;
    bank_account_no: string | null;
    branch_id: string | null;
}

interface AccountOption {
    value: string;
    label: string;
}

interface Branch {
    id: number;
    name: string;
}

interface EditAccountPageProps {
    account: FinanceAccount;
    accountTypes: AccountOption[];
    statusOptions: AccountOption[];
    branches: Branch[];
}

export default function EditFinanceAccountPage() {
    const { t } = useTranslation();
    const { account, accountTypes, statusOptions, branches } = usePage().props as unknown as EditAccountPageProps;

    const { data, setData, put, processing, errors } = useForm({
        name: account.name,
        account_type: account.account_type,
        branch_id: account.branch_id ?? '',
        status: account.status,
        description: account.description ?? '',
        bank_branch: account.bank_branch ?? '',
        bank_account_no: account.bank_account_no ?? '',
    });

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Finance'), href: route('finance.dashboard') },
        { title: t('Accounts'), href: route('finance.accounts.index') },
        { title: t('Edit') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('finance.accounts.update', account.id));
    };

    return (
        <PageTemplate
            title={t('Edit Finance Account')}
            description={t('Update the financial account details.')}
            url={`/finance/accounts/${account.id}/edit`}
            breadcrumbs={breadcrumbs}
        >
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{t('Account Details')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="name">{t('Account Name')} *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="account_type">{t('Account Type')} *</Label>
                            <Select value={data.account_type} onValueChange={(v) => setData('account_type', v)}>
                                <SelectTrigger id="account_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {accountTypes.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.account_type && <p className="text-destructive text-sm">{errors.account_type}</p>}
                        </div>

                        {data.account_type === 'bank' && (
                            <>
                                <div className="space-y-1">
                                    <Label htmlFor="bank_branch">{t('Bank Branch')} *</Label>
                                    <Input id="bank_branch" value={data.bank_branch} onChange={(e) => setData('bank_branch', e.target.value)} />
                                    {errors.bank_branch && <p className="text-destructive text-sm">{errors.bank_branch}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="bank_account_no">{t('Bank Account No.')} *</Label>
                                    <Input id="bank_account_no" value={data.bank_account_no} onChange={(e) => setData('bank_account_no', e.target.value)} />
                                    {errors.bank_account_no && <p className="text-destructive text-sm">{errors.bank_account_no}</p>}
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="branch_id">{t('Branch')}</Label>
                            <Select value={data.branch_id || 'none'} onValueChange={(v) => setData('branch_id', v === 'none' ? '' : v)}>
                                <SelectTrigger id="branch_id">
                                    <SelectValue placeholder={t('Select branch (optional)')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('None')}</SelectItem>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.branch_id && <p className="text-destructive text-sm">{errors.branch_id}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="status">{t('Status')} *</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-destructive text-sm">{errors.status}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description">{t('Description')}</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                            />
                            {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={processing}>{t('Save Changes')}</Button>
                            <Button type="button" variant="outline" onClick={() => router.visit(route('finance.accounts.index'))}>
                                {t('Cancel')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PageTemplate>
    );
}
