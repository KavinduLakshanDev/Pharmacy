import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddEntryModalProps {
    branches: { id: number; name: string }[];
    categories: { id: number; name: string }[];
    onClose: () => void;
}

export default function AddEntryModal({ branches, categories, onClose }: AddEntryModalProps) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        type: 'reimbursement',
        petty_cash_category_id: '',
        branch_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        particulars: '',
        reference: '',
        notes: '',
        total_amount: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('finance.pettycash.entries.store'), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Add Petty Cash Entry')}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label>{t('Entry Type')} *</Label>
                        <div className="flex gap-3">
                            {['reimbursement', 'usage'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setData('type', type)}
                                    className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium capitalize transition-colors ${data.type === type ? 'border-primary bg-primary text-white' : 'border-gray-300 hover:border-primary'}`}
                                >
                                    {t(type)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="entry_date">{t('Date')} *</Label>
                            <Input id="entry_date" type="date" value={data.entry_date} onChange={(e) => setData('entry_date', e.target.value)} />
                            {errors.entry_date && <p className="text-destructive text-sm">{errors.entry_date}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="total_amount">{t('Amount')} *</Label>
                            <Input id="total_amount" type="number" min="0.01" step="0.01" value={data.total_amount} onChange={(e) => setData('total_amount', e.target.value)} />
                            {errors.total_amount && <p className="text-destructive text-sm">{errors.total_amount}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="particulars">{t('Particulars')} *</Label>
                        <Input id="particulars" value={data.particulars} onChange={(e) => setData('particulars', e.target.value)} />
                        {errors.particulars && <p className="text-destructive text-sm">{errors.particulars}</p>}
                    </div>

                    {data.type === 'usage' && (
                        <div className="space-y-1">
                            <Label htmlFor="petty_cash_category_id">{t('Usage Category')} *</Label>
                            <Select
                                value={data.petty_cash_category_id || 'none'}
                                onValueChange={(v) => setData('petty_cash_category_id', v === 'none' ? '' : v)}
                            >
                                <SelectTrigger id="petty_cash_category_id">
                                    <SelectValue placeholder={t('Select category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('Select category')}</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.petty_cash_category_id && <p className="text-destructive text-sm">{errors.petty_cash_category_id}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="reference">{t('Reference')}</Label>
                            <Input id="reference" value={data.reference} onChange={(e) => setData('reference', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="branch_id">{t('Branch')}</Label>
                            <Select value={data.branch_id || 'none'} onValueChange={(v) => setData('branch_id', v === 'none' ? '' : v)}>
                                <SelectTrigger id="branch_id">
                                    <SelectValue placeholder={t('Select branch')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('None')}</SelectItem>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="notes">{t('Notes')}</Label>
                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>{t('Save Entry')}</Button>
                        <Button type="button" variant="outline" onClick={onClose}>{t('Cancel')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
