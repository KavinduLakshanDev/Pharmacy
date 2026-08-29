import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, useForm } from '@inertiajs/react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PettyCashCategory {
    id: number;
    name: string;
    status: string;
    sort_order: number | null;
}

interface ManageCategoriesPanelProps {
    categories: PettyCashCategory[];
    onClose: () => void;
}

export default function ManageCategoriesPanel({ categories, onClose }: ManageCategoriesPanelProps) {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        sort_order: '',
    });

    const editForm = useForm({
        name: '',
        sort_order: '',
        status: 'active',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('finance.pettycash.categories.store'), {
            onSuccess: () => reset(),
            preserveState: true,
        });
    };

    const handleEdit = (category: PettyCashCategory) => {
        setEditingId(category.id);
        editForm.setData({
            name: category.name,
            sort_order: String(category.sort_order ?? ''),
            status: category.status,
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        editForm.put(route('finance.pettycash.categories.update', editingId), {
            onSuccess: () => setEditingId(null),
            preserveState: true,
        });
    };

    const handleDelete = (id: number) => {
        setIsDeleting(id);
        router.delete(route('finance.pettycash.categories.destroy', id), {
            onFinish: () => setIsDeleting(null),
            preserveState: true,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('Manage Categories')}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Create form */}
                <form onSubmit={handleCreate} className="mb-4 flex gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder={t('Category name')}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                    </div>
                    <Button type="submit" disabled={processing} size="sm">
                        <Plus className="mr-1 h-4 w-4" />
                        {t('Add')}
                    </Button>
                </form>

                {/* Category list */}
                <div className="max-h-80 space-y-2 overflow-y-auto">
                    {categories.length === 0 && (
                        <p className="text-muted-foreground text-sm">{t('No categories yet.')}</p>
                    )}
                    {categories.map((category) =>
                        editingId === category.id ? (
                            <form key={category.id} onSubmit={handleUpdate} className="flex gap-2">
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="sm" disabled={editForm.processing}>{t('Save')}</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </form>
                        ) : (
                            <div key={category.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                <span className="text-sm">{category.name}</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="text-amber-500 hover:text-amber-700"
                                        aria-label={t('Edit')}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        disabled={isDeleting === category.id}
                                        className="text-red-400 hover:text-red-600 disabled:opacity-50"
                                        aria-label={t('Delete')}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={onClose}>{t('Close')}</Button>
                </div>
            </div>
        </div>
    );
}
