import { useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileImage, Upload, Clock, CheckCircle, Loader2, FileText, Send, MessageCircle, ChevronDown, ChevronUp, Truck, Download, X as XIcon } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import CustomerPortalLayout from '@/layouts/customer-portal-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
    id: number;
    sender_type: 'customer' | 'pharmacist';
    message: string;
    created_at: string;
}

interface AlternativeProduct {
    id: number;
    name: string;
}

interface MedicineItem {
    medicine_name: string;
    generic_name?: string | null;
    available: boolean;
    alternatives?: AlternativeProduct[];
    // legacy fields for backward compat
    alternative_product_id?: number | null;
    alternative_product_name?: string | null;
    note: string;
    // admin-filled fields
    product_name?: string | null;
    quantity?: string | null;
    price?: string | null;
}

interface Prescription {
    id: number;
    image_url: string;
    customer_notes: string | null;
    delivery_requested: boolean;
    delivery_address: string | null;
    status: 'pending' | 'processing' | 'ready';
    staff_message: string | null;
    medicine_items: MedicineItem[] | null;
    messages: ChatMessage[];
    created_at: string;
}

interface PrescriptionsProps {
    prescriptions: Prescription[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof Clock }> = {
    pending: { label: 'Pending', variant: 'secondary', icon: Clock },
    processing: { label: 'Processing', variant: 'default', icon: Loader2 },
    ready: { label: 'Ready for Pickup', variant: 'default', icon: CheckCircle },
};

function ChatPanel({ prescription }: { prescription: Prescription }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(prescription.messages.length > 0);
    const bottomRef = useRef<HTMLDivElement>(null);

    const { data, setData, post, processing, reset, errors } = useForm({ message: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('customer-portal.prescriptions.messages.store', prescription.id), {
            onSuccess: () => {
                reset('message');
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            },
        });
    };

    return (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            <button
                type="button"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                onClick={() => setOpen((o) => !o)}
            >
                <MessageCircle className="h-3.5 w-3.5" />
                {t('Chat with pharmacist')}
                {prescription.messages.length > 0 && (
                    <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                        {prescription.messages.length}
                    </span>
                )}
                {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {open && (
                <div className="mt-2 space-y-2">
                    {/* Message thread */}
                    <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-3">
                        {prescription.messages.length === 0 ? (
                            <p className="text-center text-xs text-gray-400">{t('No messages yet. Send a message below.')}</p>
                        ) : (
                            prescription.messages.map((msg) => {
                                const isMe = msg.sender_type === 'customer';
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                            isMe
                                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-none'
                                        }`}>
                                            <p className="leading-snug">{msg.message}</p>
                                            <p className={`mt-0.5 text-[10px] ${isMe ? 'text-primary-foreground/70 text-right' : 'text-gray-400'}`}>
                                                {isMe ? t('You') : t('Pharmacist')} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Reply input */}
                    <form onSubmit={submit} className="flex items-end gap-2">
                        <div className="flex-1">
                            <Textarea
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                placeholder={t('Type a message…')}
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
            )}
        </div>
    );
}

function InvoiceModal({ prescriptionId, onClose }: { prescriptionId: number; onClose: () => void }) {
    const { t } = useTranslation();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const invoiceUrl = route('customer-portal.prescriptions.invoice', prescriptionId);

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
                style={{ maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        {t('Invoice')} #{prescriptionId}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" />
                            {t('Download / Print')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label={t('Close')}
                        >
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <iframe
                    ref={iframeRef}
                    src={invoiceUrl}
                    className="w-full flex-1 rounded-b-xl"
                    style={{ minHeight: '60vh' }}
                    title={`Invoice #${prescriptionId}`}
                />
            </div>
        </div>
    );
}

export default function CustomerPrescriptions({ prescriptions }: PrescriptionsProps) {
    const { t } = useTranslation();
    const { flash } = usePage().props as any;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [invoiceModalId, setInvoiceModalId] = useState<number | null>(null);

    // Track pharmacist-message counts so we can notify on new replies
    const prevPharmacistMsgCounts = useRef<Record<number, number>>({});

    useEffect(() => {
        for (const prescription of prescriptions) {
            const pharmacistMsgs = prescription.messages.filter((m) => m.sender_type === 'pharmacist').length;
            const prev = prevPharmacistMsgCounts.current[prescription.id] ?? pharmacistMsgs;
            if (pharmacistMsgs > prev) {
                toast.info(t('You have a new reply from the pharmacist on prescription') + ` #${prescription.id}`);
            }
            prevPharmacistMsgCounts.current[prescription.id] = pharmacistMsgs;
        }
    }, [prescriptions]);

    // Poll for new messages every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['prescriptions'] });
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    const { data, setData, post, processing, errors, reset } = useForm({
        image: null as File | null,
        notes: '',
        delivery_requested: false as boolean,
        delivery_address: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData('image', file);
        setImagePreview(URL.createObjectURL(file));
    };

    const totalPrescriptions = prescriptions.length;
    const statusCounts = {
        pending: prescriptions.filter((item) => item.status === 'pending').length,
        processing: prescriptions.filter((item) => item.status === 'processing').length,
        ready: prescriptions.filter((item) => item.status === 'ready').length,
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('customer-portal.prescriptions.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    return (
        <>
        <CustomerPortalLayout title={t('Prescriptions')}>
            <div className="space-y-6">
                <div className="space-y-3">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('My Prescriptions')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
                            {t('Upload your doctor\'s prescription and track its status with a secure, easy-to-use portal.')}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="rounded-3xl border border-gray-200 bg-white/90 dark:border-gray-800 dark:bg-gray-950/90 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">{t('Total requests')}</p>
                            <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{totalPrescriptions}</p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('All submitted prescriptions')}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-white/90 dark:border-gray-800 dark:bg-gray-950/90 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">{t('Pending')}</p>
                            <p className="mt-3 text-3xl font-semibold text-amber-600 dark:text-amber-400">{statusCounts.pending}</p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('Awaiting pharmacist review')}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-white/90 dark:border-gray-800 dark:bg-gray-950/90 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">{t('Processing')}</p>
                            <p className="mt-3 text-3xl font-semibold text-sky-600 dark:text-sky-400">{statusCounts.processing}</p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('In progress')}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-white/90 dark:border-gray-800 dark:bg-gray-950/90 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">{t('Ready')}</p>
                            <p className="mt-3 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">{statusCounts.ready}</p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('Ready for pickup')}</p>
                        </div>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {/* Two-column layout: form left, history right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left: Upload form */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                {t('Submit New Prescription')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <Label htmlFor="prescription-image">{t('Prescription Photo')}</Label>
                                    <div className="mt-1">
                                        {imagePreview ? (
                                            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-2">
                                                <img
                                                    src={imagePreview}
                                                    alt={t('Prescription preview')}
                                                    className="max-h-64 w-full object-contain bg-gray-50 dark:bg-gray-900"
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
                                            >
                                                <FileImage className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {t('Click to upload prescription photo')}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">{t('JPG, PNG or GIF. Max 5MB.')}</p>
                                            </button>
                                        )}
                                        {imagePreview && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {t('Change Image')}
                                            </Button>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            id="prescription-image"
                                            type="file"
                                            accept="image/jpeg,image/png,image/gif"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <InputError message={errors.image} className="mt-1" />
                                </div>

                                <div>
                                    <Label htmlFor="notes">{t('Additional Notes')} <span className="text-gray-400">({t('optional')})</span></Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="mt-1 resize-none"
                                        rows={3}
                                        placeholder={t('Any specific instructions or notes for the pharmacist...')}
                                    />
                                    <InputError message={errors.notes} className="mt-1" />
                                </div>

                                {/* Delivery Request */}
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.delivery_requested}
                                            onChange={(e) => setData('delivery_requested', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            <Truck className="h-4 w-4 text-primary" />
                                            {t('Request Home Delivery')}
                                        </span>
                                    </label>
                                    {data.delivery_requested && (
                                        <div>
                                            <Label htmlFor="delivery_address">{t('Delivery Address')} <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                id="delivery_address"
                                                value={data.delivery_address}
                                                onChange={(e) => setData('delivery_address', e.target.value)}
                                                className="mt-1 resize-none"
                                                rows={2}
                                                placeholder={t('Enter your full delivery address...')}
                                            />
                                            <InputError message={errors.delivery_address} className="mt-1" />
                                            <p className="text-xs text-gray-400 mt-1">{t('A delivery charge may apply. The pharmacy will confirm the amount.')}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing || !data.image}>
                                        {processing ? t('Submitting...') : t('Submit Prescription')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Right: Prescription history */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('Prescription History')}</h2>
                    {prescriptions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                            <p>{t('No prescriptions submitted yet')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {prescriptions.map((prescription) => {
                                const config = STATUS_CONFIG[prescription.status];
                                const Icon = config.icon;
                                const isReady = prescription.status === 'ready';
                                return (
                                    <Card key={prescription.id} className={isReady ? 'border-green-300 dark:border-green-700' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <a
                                                    href={prescription.image_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0"
                                                >
                                                    <img
                                                        src={prescription.image_url}
                                                        alt={t('Prescription')}
                                                        className="h-16 w-16 rounded-md object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
                                                    />
                                                </a>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant={isReady ? 'default' : config.variant} className={isReady ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                            <Icon className="h-3 w-3 mr-1" />
                                                            {t(config.label)}
                                                        </Badge>
                                                        {prescription.delivery_requested && (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700 gap-1">
                                                                <Truck className="h-3 w-3" />
                                                                {t('Home Delivery')}
                                                            </Badge>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(prescription.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {prescription.customer_notes && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                            {prescription.customer_notes}
                                                        </p>
                                                    )}
                                                    {prescription.delivery_requested && prescription.delivery_address && (
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-start gap-1">
                                                            <Truck className="h-3 w-3 mt-0.5 shrink-0" />
                                                            {prescription.delivery_address}
                                                        </p>
                                                    )}
                                                    {prescription.staff_message && (
                                                        <div className={`mt-2 rounded-md px-3 py-2 text-sm ${isReady ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'}`}>
                                                            <span className="font-medium">{t('Pharmacist')}: </span>
                                                            {prescription.staff_message}
                                                        </div>
                                                    )}
                                                    {Array.isArray(prescription.medicine_items) && prescription.medicine_items.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                {t('Medicine Availability')}
                                                            </p>
                                                            {prescription.medicine_items.map((item, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`rounded-md border px-3 py-2 text-sm ${
                                                                        item.available
                                                                            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                                                                            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`font-semibold ${
                                                                            item.available ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                                                                        }`}>
                                                                            {item.available ? '✓' : '✗'}
                                                                        </span>
                                                                        <span className="font-medium text-gray-800 dark:text-gray-200">
                                                                            {item.product_name || item.medicine_name || t('Medicine')}
                                                                        </span>
                                                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                                                            item.available
                                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                                                        }`}>
                                                                            {item.available ? t('Available') : t('Not Available')}
                                                                        </span>
                                                                        {item.available && item.quantity && (
                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {t('Qty')}: {item.quantity}
                                                                            </span>
                                                                        )}
                                                                        {item.available && item.price && (
                                                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                                {item.price}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {!item.available && (item.alternatives?.length ?? 0) > 0 && (
                                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                                            <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">{t('Alternatives')}:</span>
                                                                            {item.alternatives!.map((alt) => (
                                                                                <span key={alt.id} className="text-xs font-semibold text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-full px-2 py-0.5">
                                                                                    {alt.name}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {!item.available && !item.alternatives?.length && item.alternative_product_name && (
                                                                        <p className="mt-1 text-xs text-orange-700 dark:text-orange-400">
                                                                            {t('Alternative')}: <span className="font-semibold">{item.alternative_product_name}</span>
                                                                        </p>
                                                                    )}
                                                                    {item.note && (
                                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.note}</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {Array.isArray(prescription.medicine_items) && prescription.medicine_items.some((i) => i.available && i.price) && (
                                                        <div className="mt-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => setInvoiceModalId(prescription.id)}
                                                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                                                            >
                                                                <FileText className="h-3.5 w-3.5" />
                                                                {t('View Invoice')}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <ChatPanel prescription={prescription} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                    </div>
                    {/* end right column */}
                </div>
                {/* end two-column grid */}
            </div>
        </CustomerPortalLayout>
        {invoiceModalId !== null && (
            <InvoiceModal prescriptionId={invoiceModalId} onClose={() => setInvoiceModalId(null)} />
        )}
        </>
    );
}
