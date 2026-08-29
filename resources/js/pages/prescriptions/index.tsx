import { useForm, router } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Loader2, CheckCircle, Eye, Plus, Trash2, Search, CheckCircle2, XCircle, X, Send, Truck, Receipt } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';

interface Customer {
    id: number;
    name: string;
    code: string | null;
    phone: string | null;
    email: string | null;
}

interface AlternativeProduct {
    [key: string]: FormDataConvertible;
    id: number;
    name: string;
    sale_price: string | null;
}

interface MedicineItem {
    [key: string]: FormDataConvertible;
    medicine_name: string;
    generic_name: string | null;
    available: boolean;
    alternatives: AlternativeProduct[];
    note: string;
    price: string | null;
    product_id: number | null;
    product_name: string | null;
    quantity: string;
}

interface ProductSuggestion {
    id: number;
    name: string;
    sku: string | null;
    generic_name: string | null;
    sale_price: string | null;
}

interface ChatMessage {
    id: number;
    sender_type: 'customer' | 'pharmacist';
    message: string;
    created_at: string;
}

interface Prescription {
    id: number;
    image_url: string;
    customer_notes: string | null;
    delivery_requested: boolean;
    delivery_address: string | null;
    delivery_charge: number | null;
    status: 'pending' | 'processing' | 'ready';
    staff_message: string | null;
    medicine_items: MedicineItem[] | null;
    messages: ChatMessage[];
    created_at: string;
    customer: Customer | null;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PrescriptionsPaginated {
    data: Prescription[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    total: number;
}

interface PrescriptionsIndexProps {
    prescriptions: PrescriptionsPaginated;
    filters: { status?: string };
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof Clock; badgeClass?: string }> = {
    pending: { label: 'Pending', variant: 'secondary', icon: Clock },
    processing: { label: 'Processing', variant: 'default', icon: Loader2 },
    ready: { label: 'Ready for Pickup', variant: 'default', icon: CheckCircle, badgeClass: 'bg-green-600 hover:bg-green-700' },
};

function emptyMedicineItem(): MedicineItem {
    return {
        medicine_name: '',
        generic_name: '',
        available: true,
        alternatives: [],
        note: '',
        price: '',
        product_id: null,
        product_name: null,
        quantity: '1',
    };
}

function AvailableProductSearch({
    rowIndex = 'item',
    placeholder,
    onSelect,
}: {
    rowIndex?: string | number;
    placeholder?: string;
    onSelect: (id: number, name: string, price: string | null) => void;
}) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const search = (q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim()) { setResults([]); setOpen(false); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const url = route('inventory.prescriptions.products-search') + `?q=${encodeURIComponent(q)}`;
                const res = await fetch(url, { headers: { Accept: 'application/json' } });
                const fetched: ProductSuggestion[] = await res.json();
                setResults(fetched);
                setOpen(true);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Input
                    id={`avail-search-${rowIndex}`}
                    value={query}
                    placeholder={placeholder ?? t('Search product from system…')}
                    className="pl-8 h-8 text-sm"
                    onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
                    onFocus={() => { if (results.length > 0) setOpen(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                />
                {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400" />}
            </div>
            {open && results.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {results.map((p) => (
                        <li key={p.id}>
                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-2"
                                onClick={() => {
                                    setQuery('');
                                    setOpen(false);
                                    onSelect(p.id, p.name, p.sale_price);
                                }}
                            >
                                <span className="font-medium flex-1">{p.name}</span>
                                {p.generic_name && <span className="text-xs text-gray-400">({p.generic_name})</span>}
                                {p.sku && <span className="text-xs text-gray-400">#{p.sku}</span>}
                                {p.sale_price && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{p.sale_price}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function AlternativeSearch({
    rowIndex,
    existingIds,
    onAdd,
}: {
    rowIndex: number;
    existingIds: number[];
    onAdd: (id: number, name: string, price: string | null) => void;
}) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const search = (q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim()) { setResults([]); setOpen(false); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const url = route('inventory.prescriptions.products-search') + `?q=${encodeURIComponent(q)}`;
                const res = await fetch(url, { headers: { Accept: 'application/json' } });
                const fetched: ProductSuggestion[] = await res.json();
                setResults(fetched);
                setOpen(true);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const filtered = results.filter((p) => !existingIds.includes(p.id));

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Input
                    id={`alt-search-${rowIndex}`}
                    value={query}
                    placeholder={t('Search to add an alternative…')}
                    className="pl-8 h-8 text-sm"
                    onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
                    onFocus={() => { if (filtered.length > 0) setOpen(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                />
                {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400" />}
            </div>
            {open && filtered.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {filtered.map((p) => (
                        <li key={p.id}>
                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                                onClick={() => {
                                    setQuery('');
                                    setOpen(false);
                                    onAdd(p.id, p.name, p.sale_price);
                                }}
                            >
                                <span className="font-medium">{p.name}</span>
                                {p.generic_name && <span className="ml-2 text-xs text-gray-400">({p.generic_name})</span>}
                                {p.sku && <span className="ml-2 text-xs text-gray-400">#{p.sku}</span>}
                                {p.sale_price && <span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400">{p.sale_price}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ChatThreadPanel({ prescription }: { prescription: Prescription }) {
    const { t } = useTranslation();
    const bottomRef = useRef<HTMLDivElement>(null);
    const { data, setData, post, processing, reset, errors } = useForm({ message: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('inventory.prescriptions.messages.store', prescription.id), {
            onSuccess: () => {
                reset('message');
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            },
        });
    };

    return (
        <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('Chat')}</p>

            {/* Thread */}
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-3 space-y-2">
                {prescription.messages.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">{t('No messages yet.')}</p>
                ) : (
                    prescription.messages.map((msg) => {
                        const isPharmacist = msg.sender_type === 'pharmacist';
                        return (
                            <div key={msg.id} className={`flex ${isPharmacist ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                    isPharmacist
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-none'
                                }`}>
                                    <p className="leading-snug">{msg.message}</p>
                                    <p className={`mt-0.5 text-[10px] ${isPharmacist ? 'text-primary-foreground/70 text-right' : 'text-gray-400'}`}>
                                        {isPharmacist ? t('You') : (prescription.customer?.name ?? t('Customer'))} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Reply */}
            <form onSubmit={submit} className="flex items-end gap-2">
                <div className="flex-1">
                    <Textarea
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        placeholder={t('Reply to customer…')}
                        className="resize-none text-sm min-h-[38px] max-h-24"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (data.message.trim()) submit(e as unknown as React.FormEvent<HTMLFormElement>);
                            }
                        }}
                    />
                    <InputError message={errors.message} className="mt-1 text-xs" />
                </div>
                <Button type="submit" size="sm" disabled={processing || !data.message.trim()} className="shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}

function PrescriptionDetailModal({ prescription, onClose }: { prescription: Prescription; onClose: () => void }) {
    const { t } = useTranslation();

    const initialItems: MedicineItem[] = Array.isArray(prescription.medicine_items) && prescription.medicine_items.length > 0
        ? prescription.medicine_items.map((item) => {
            const base = { ...emptyMedicineItem(), ...item };
            // Migrate legacy single-alternative fields to the new array format
            const legacy = item as MedicineItem & { alternative_product_id?: number | null; alternative_product_name?: string | null };
            if ((!base.alternatives || base.alternatives.length === 0) && legacy.alternative_product_id) {
                base.alternatives = [{ id: legacy.alternative_product_id, name: legacy.alternative_product_name ?? '', sale_price: null }];
            }
            return base;
        })
        : [];

    const { data, setData, put, processing, errors, transform } = useForm<{
        [key: string]: FormDataConvertible;
        status: 'pending' | 'processing' | 'ready';
        staff_message: string;
        medicine_items: MedicineItem[];
    }>({
        status: prescription.status,
        staff_message: prescription.staff_message ?? '',
        medicine_items: initialItems,
    });

    transform((d) => ({
        ...d,
        medicine_items: d.medicine_items.filter(
            (item) =>
                (item.medicine_name ?? '').trim() !== '' ||
                item.product_id !== null ||
                !item.available ||
                item.alternatives.length > 0,
        ),
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('inventory.prescriptions.update', prescription.id), {
            onSuccess: () => onClose(),
        });
    };

    const updateItem = (index: number, patch: Partial<MedicineItem>) => {
        const updated = data.medicine_items.map((item, i) =>
            i === index ? ({ ...item, ...patch } as MedicineItem) : item,
        );

        setData('medicine_items', updated);
    };

    const removeItem = (index: number) => {
        setData('medicine_items', data.medicine_items.filter((_, i) => i !== index));
    };

    const addAlternative = (itemIdx: number, productId: number, productName: string, price: string | null) => {
        setData('medicine_items', data.medicine_items.map((item, i) => {
            if (i !== itemIdx) return item;
            if (item.alternatives.some((a) => a.id === productId)) return item;
            return { ...item, alternatives: [...item.alternatives, { id: productId, name: productName, sale_price: price }] };
        }));
    };

    const removeAlternative = (itemIdx: number, altIdx: number) => {
        setData('medicine_items', data.medicine_items.map((item, i) => {
            if (i !== itemIdx) return item;
            return { ...item, alternatives: item.alternatives.filter((_, j) => j !== altIdx) };
        }));
    };

    const { data: invoiceData, setData: setInvoiceData, post: postInvoice, processing: invoiceProcessing } = useForm({
        delivery_charge: String(prescription.delivery_charge ?? '0'),
    });

    const submitInvoice: FormEventHandler = (e) => {
        e.preventDefault();
        postInvoice(route('inventory.prescriptions.invoice', prescription.id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('Prescription #:id', { id: prescription.id })}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                        aria-label={t('Close')}
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    {/* Customer info */}
                    {prescription.customer && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">{t('Customer')}: </span>
                                <span className="font-medium">{prescription.customer.name}</span>
                            </div>
                            {prescription.customer.code && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">{t('Code')}: </span>
                                    <span className="font-medium">{prescription.customer.code}</span>
                                </div>
                            )}
                            {prescription.customer.phone && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">{t('Phone')}: </span>
                                    <span className="font-medium">{prescription.customer.phone}</span>
                                </div>
                            )}
                            {prescription.customer.email && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">{t('Email')}: </span>
                                    <span className="font-medium">{prescription.customer.email}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Prescription image */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Prescription Image')}</p>
                        <a href={prescription.image_url} target="_blank" rel="noopener noreferrer">
                            <img
                                src={prescription.image_url}
                                alt={t('Prescription')}
                                className="w-full max-h-80 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:opacity-90 transition-opacity"
                            />
                        </a>
                        <p className="text-xs text-gray-400 mt-1">{t('Click image to view full size')}</p>
                    </div>

                    {/* Customer notes */}
                    {prescription.customer_notes && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Customer Notes')}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                                {prescription.customer_notes}
                            </p>
                        </div>
                    )}

                    {/* Delivery request */}
                    {prescription.delivery_requested && (
                        <div className="rounded-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-3">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-1">
                                <Truck className="h-4 w-4" />
                                {t('Home Delivery Requested')}
                            </p>
                            {prescription.delivery_address && (
                                <p className="text-sm text-blue-700 dark:text-blue-400">{prescription.delivery_address}</p>
                            )}
                        </div>
                    )}

                    {/* Chat thread */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                        <ChatThreadPanel prescription={prescription} />
                    </div>

                    {/* Status update form */}
                    <form onSubmit={submit} className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('Update Status')}</p>

                        <div>
                            <Label htmlFor="status">{t('Status')}</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v as typeof data.status)}>
                                <SelectTrigger id="status" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">{t('Pending')}</SelectItem>
                                    <SelectItem value="processing">{t('Processing')}</SelectItem>
                                    <SelectItem value="ready">{t('Ready for Pickup')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} className="mt-1" />
                        </div>

                        {/* Medicine availability items */}
                        <div className="space-y-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('Medicine Availability')}</p>

                            {/* ── AVAILABLE ── */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />{t('Available Medicines')}
                                </p>

                                {/* Compact list of available items */}
                                {data.medicine_items.some((i) => i.available) && (
                                    <div className="space-y-1.5">
                                        {data.medicine_items.map((item, idx) => item.available && (
                                            <div key={idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 px-3 py-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                                <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                                    {item.product_name || item.medicine_name || <span className="text-gray-400 italic">{t('(unnamed)')}</span>}
                                                </span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-gray-400 mb-0.5">{t('Qty')}</span>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity}
                                                            className="w-16 h-7 text-sm text-center"
                                                            onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-gray-400 mb-0.5">{t('Price')}</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.price ?? ''}
                                                            placeholder="0.00"
                                                            className="w-24 h-7 text-sm"
                                                            onChange={(e) => updateItem(idx, { price: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-gray-400 mb-0.5">{t('Note')}</span>
                                                        <Input
                                                            value={item.note}
                                                            placeholder={t('optional')}
                                                            className="w-32 h-7 text-sm"
                                                            onChange={(e) => updateItem(idx, { note: e.target.value })}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors mt-4"
                                                        aria-label={t('Remove')}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Search to add available medicines */}
                                <AvailableProductSearch
                                    rowIndex="available"
                                    placeholder={t('Search medicine from system to add…')}
                                    onSelect={(id, name, price) =>
                                        setData('medicine_items', [
                                            ...data.medicine_items,
                                            { ...emptyMedicineItem(), product_id: id, product_name: name, price: price ?? '', available: true },
                                        ])
                                    }
                                />
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700" />

                            {/* ── UNAVAILABLE ── */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <XCircle className="h-3.5 w-3.5" />{t('Unavailable Medicines')}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setData('medicine_items', [...data.medicine_items, { ...emptyMedicineItem(), available: false }])}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />{t('Add Unavailable')}
                                    </Button>
                                </div>

                                {data.medicine_items.map((item, idx) => !item.available && (
                                    <div key={idx} className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10 p-3 space-y-3">
                                        {/* Name + generic + remove */}
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label htmlFor={`med-name-${idx}`} className="text-xs text-gray-500 mb-1 block">{t('Medicine name')}</Label>
                                                    <Input
                                                        id={`med-name-${idx}`}
                                                        value={item.medicine_name}
                                                        placeholder={t('e.g. Amoxicillin 500mg')}
                                                        className="h-8 text-sm"
                                                        onChange={(e) => updateItem(idx, { medicine_name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`med-generic-${idx}`} className="text-xs text-gray-500 mb-1 block">
                                                        {t('Generic name')} <span className="text-gray-400">({t('optional')})</span>
                                                    </Label>
                                                    <Input
                                                        id={`med-generic-${idx}`}
                                                        value={item.generic_name ?? ''}
                                                        placeholder={t('e.g. Amoxicillin')}
                                                        className="h-8 text-sm"
                                                        onChange={(e) => updateItem(idx, { generic_name: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="shrink-0 pt-5 text-gray-400 hover:text-red-500 transition-colors"
                                                aria-label={t('Remove')}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Alternatives */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-gray-500 block">{t('Suggest alternatives (same generic)')}</Label>
                                            {item.alternatives.map((alt, altIdx) => (
                                                <div key={alt.id} className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-2.5 py-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                                    <span className="flex-1 text-xs font-medium text-green-800 dark:text-green-300">{alt.name}</span>
                                                    {alt.sale_price && (
                                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{alt.sale_price}</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAlternative(idx, altIdx)}
                                                        className="text-green-500 hover:text-red-500 transition-colors"
                                                        aria-label={t('Remove')}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <AlternativeSearch
                                                rowIndex={idx}
                                                existingIds={item.alternatives.map((a) => a.id)}
                                                onAdd={(id, name, price) => addAlternative(idx, id, name, price)}
                                            />
                                        </div>

                                        {/* Note */}
                                        <div>
                                            <Label htmlFor={`med-note-${idx}`} className="text-xs text-gray-500 mb-1 block">
                                                {t('Note')} <span className="text-gray-400">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id={`med-note-${idx}`}
                                                value={item.note}
                                                placeholder={t('e.g. Out of stock until next week')}
                                                className="h-8 text-sm"
                                                onChange={(e) => updateItem(idx, { note: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="staff_message">{t('Overall message to customer')} <span className="text-gray-400">({t('optional')})</span></Label>
                            <Textarea
                                id="staff_message"
                                value={data.staff_message}
                                onChange={(e) => setData('staff_message', e.target.value)}
                                className="mt-1 resize-none"
                                rows={3}
                                placeholder={t('e.g. Your medicine is ready. Please collect at the counter.')}
                            />
                            <InputError message={errors.staff_message} className="mt-1" />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? t('Saving...') : t('Send & Update')}
                            </Button>
                        </div>
                    </form>

                    {/* Invoice Generation */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-blue-600" />
                            {t('Generate & Send Invoice')}
                        </p>
                        {prescription.customer?.email ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('Invoice will be emailed to')}: <span className="font-medium text-gray-700 dark:text-gray-300">{prescription.customer.email}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-red-500">{t('Customer has no email address — cannot send invoice.')}</p>
                        )}
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            {t('Save the prescription above first to include the latest medicine prices in the invoice.')}
                        </p>
                        <form onSubmit={submitInvoice} className="flex items-end gap-3">
                            <div className="w-44">
                                <Label htmlFor="inv-delivery-charge">{t('Delivery Charge')}</Label>
                                <Input
                                    id="inv-delivery-charge"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={invoiceData.delivery_charge}
                                    onChange={(e) => setInvoiceData('delivery_charge', e.target.value)}
                                    className="mt-1"
                                    placeholder="0.00"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={invoiceProcessing || !prescription.customer?.email}
                                className="shrink-0 bg-blue-600 hover:bg-blue-700"
                            >
                                <Receipt className="h-4 w-4 mr-1" />
                                {invoiceProcessing ? t('Sending…') : t('Send Invoice')}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PrescriptionsIndex({ prescriptions, filters }: PrescriptionsIndexProps) {
    const { t } = useTranslation();
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

    // Track customer-message counts per prescription so we can detect new incoming messages
    const prevCustomerMsgCounts = useRef<Record<number, number>>({});

    useEffect(() => {
        // Check for new customer messages after every data refresh
        for (const prescription of prescriptions.data) {
            const customerMsgs = prescription.messages.filter((m) => m.sender_type === 'customer').length;
            const prev = prevCustomerMsgCounts.current[prescription.id] ?? customerMsgs;
            if (customerMsgs > prev) {
                const customerName = prescription.customer?.name ?? t('A customer');
                toast.info(`${customerName} ${t('sent a new message on prescription')} #${prescription.id}`);
            }
            prevCustomerMsgCounts.current[prescription.id] = customerMsgs;
        }
    }, [prescriptions]);

    // Poll for new messages every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['prescriptions'] });
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Inventory'), href: route('inventory.dashboard') },
        { title: t('Prescriptions') },
    ];

    const handleStatusFilter = (value: string) => {
        router.get(route('inventory.prescriptions.index'), { status: value === 'all' ? undefined : value }, { preserveState: true });
    };

    return (
        <PageTemplate
            title={t('Prescriptions')}
            description={t('Manage customer prescription requests')}
            url="/inventory/prescriptions"
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Select value={filters.status ?? 'all'} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder={t('Filter by status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('All Statuses')}</SelectItem>
                            <SelectItem value="pending">{t('Pending')}</SelectItem>
                            <SelectItem value="processing">{t('Processing')}</SelectItem>
                            <SelectItem value="ready">{t('Ready for Pickup')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {prescriptions.total} {t('total')}
                    </span>
                </div>

                {prescriptions.data.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">{t('No prescriptions found')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {prescriptions.data.map((prescription) => {
                            const config = STATUS_CONFIG[prescription.status];
                            const Icon = config.icon;
                            const isReady = prescription.status === 'ready';
                            return (
                                <Card key={prescription.id} className={isReady ? 'border-green-300 dark:border-green-700' : ''}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={prescription.image_url}
                                                alt={t('Prescription')}
                                                className="h-14 w-14 rounded-md object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                        {prescription.customer?.name ?? t('Unknown Customer')}
                                                    </span>
                                                    {prescription.customer?.code && (
                                                        <span className="text-xs text-gray-400">#{prescription.customer.code}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        variant={isReady ? 'default' : config.variant}
                                                        className={config.badgeClass}
                                                    >
                                                        <Icon className="h-3 w-3 mr-1" />
                                                        {t(config.label)}
                                                    </Badge>
                                                    {prescription.delivery_requested && (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                                            <Truck className="h-3 w-3" />
                                                            {t('Delivery')}
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(prescription.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {prescription.customer_notes && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                                        {prescription.customer_notes}
                                                    </p>
                                                )}
                                                {Array.isArray(prescription.medicine_items) && prescription.medicine_items.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {prescription.medicine_items.map((mi, i) => (
                                                            <span
                                                                key={i}
                                                                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                                    mi.available
                                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                                }`}
                                                            >
                                                                {mi.available ? '✓' : '✗'} {mi.medicine_name || t('Medicine')}
                                                {mi.generic_name ? ` (${mi.generic_name})` : ''}
                                                                {!mi.available && mi.alternatives?.length > 0 && (
                                                                    <span className="text-orange-600"> → {mi.alternatives.map((a) => a.name).join(', ')}</span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.visit(route('inventory.prescriptions.show', prescription.id))}
                                                className="shrink-0"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                {t('View')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {prescriptions.last_page > 1 && (
                    <div className="flex justify-center gap-1 pt-2">
                        {prescriptions.links.map((link, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1.5 rounded text-sm border transition-colors ${link.active ? 'bg-primary text-primary-foreground border-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedPrescription && (
                <PrescriptionDetailModal
                    prescription={selectedPrescription}
                    onClose={() => setSelectedPrescription(null)}
                />
            )}
        </PageTemplate>
    );
}
