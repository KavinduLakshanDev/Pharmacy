import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddTransactionModalProps {
    accounts: { id: number; name: string }[];
    branches: { id: number; name: string }[];
    onClose: () => void;
}

export default function AddTransactionModal({ accounts, branches, onClose }: AddTransactionModalProps) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        finance_account_id: '',
        amount: '',
        type: 'credit',
        transaction_date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        branch_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('finance.transactions.store'), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Add Transaction')}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="finance_account_id">{t('Account')} *</Label>
                        <Select value={data.finance_account_id} onValueChange={(v) => setData('finance_account_id', v)}>
                            <SelectTrigger id="finance_account_id">
                                <SelectValue placeholder={t('Select account')} />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((a) => (
                                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.finance_account_id && <p className="text-destructive text-sm">{errors.finance_account_id}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="type">{t('Type')} *</Label>
                            <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit">{t('Credit')}</SelectItem>
                                    <SelectItem value="debit">{t('Debit')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="amount">{t('Amount')} *</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                            />
                            {errors.amount && <p className="text-destructive text-sm">{errors.amount}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="transaction_date">{t('Date')} *</Label>
                        <Input
                            id="transaction_date"
                            type="date"
                            value={data.transaction_date}
                            onChange={(e) => setData('transaction_date', e.target.value)}
                        />
                        {errors.transaction_date && <p className="text-destructive text-sm">{errors.transaction_date}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="reference">{t('Reference')}</Label>
                        <Input id="reference" value={data.reference} onChange={(e) => setData('reference', e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="description">{t('Description')}</Label>
                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} />
                    </div>

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
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>{t('Save')}</Button>
                        <Button type="button" variant="outline" onClick={onClose}>{t('Cancel')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
