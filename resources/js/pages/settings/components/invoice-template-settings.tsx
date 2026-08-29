import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Check } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function InvoiceTemplateSettings() {
    const { t } = useTranslation();
    const { settings } = usePage().props as any;
    const [selectedTemplate, setSelectedTemplate] = useState(settings?.invoiceTemplate || 1);

    // Update selected template when settings change
    React.useEffect(() => {
        if (settings?.invoiceTemplate) {
            setSelectedTemplate(parseInt(settings.invoiceTemplate));
        }
    }, [settings]);
    const [previewTemplate, setPreviewTemplate] = useState<number | null>(null);

    const templates = [
        {
            id: 1,
            name: t('Classic Blue'),
            description: t('Professional blue theme'),
            colors: { primary: '#3b82f6', secondary: '#1d4ed8' }
        },
        {
            id: 2,
            name: t('Modern Minimal'),
            description: t('Clean minimal design'),
            colors: { primary: '#6b7280', secondary: '#374151' }
        },
        {
            id: 3,
            name: t('Corporate Green'),
            description: t('Business green style'),
            colors: { primary: '#059669', secondary: '#047857' }
        },
        {
            id: 4,
            name: t('Creative Orange'),
            description: t('Vibrant orange theme'),
            colors: { primary: '#ea580c', secondary: '#c2410c' }
        },
        {
            id: 5,
            name: t('Elegant Purple'),
            description: t('Sophisticated purple'),
            colors: { primary: '#7c3aed', secondary: '#5b21b6' }
        },
        {
            id: 6,
            name: t('Bold Red'),
            description: t('Modern red style'),
            colors: { primary: '#dc2626', secondary: '#991b1b' }
        },
        {
            id: 7,
            name: t('Ocean Cyan'),
            description: t('Fresh ocean blue'),
            colors: { primary: '#0891b2', secondary: '#0e7490' }
        },
        {
            id: 8,
            name: t('Golden Yellow'),
            description: t('Luxury golden theme'),
            colors: { primary: '#d97706', secondary: '#92400e' }
        },
        {
            id: 9,
            name: t('Vibrant Pink'),
            description: t('Creative pink style'),
            colors: { primary: '#db2777', secondary: '#be185d' }
        }
    ];

    const handleSelectTemplate = (templateId: number) => {
        toast.loading(t('Invoice template updating...'));
        router.post(route('settings.invoice-template'), { template_id: templateId }, {
            preserveScroll: true,
            onSuccess: (page) => {
                toast.dismiss();
                setSelectedTemplate(templateId);
                // toast.success(t('Invoice template updated successfully!'));
                const successMessage = page.props.flash?.success;
                const errorMessage = page.props.flash?.error;
                const warningMessage = page.props.flash?.warning;

                if (successMessage) {
                    toast.success(successMessage);
                } else if (errorMessage) {
                    toast.error(errorMessage);
                } else if (warningMessage) {
                    toast.success(warningMessage);
                }

            },
            onError: (errors) => {
                console.error('Failed to update template:', errors);
                toast.error(t('Failed to update invoice template. Please try again.'));
            }
        });
    };

    const handlePreview = (templateId: number) => {
        setPreviewTemplate(templateId);
    };

    const closePreview = () => {
        setPreviewTemplate(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Invoice Templates')}</CardTitle>
                <p className="text-sm text-gray-600">
                    {t('Choose a template design for your invoices')}
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className={`relative border rounded-lg p-4 transition-all cursor-pointer group overflow-hidden ${selectedTemplate === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {/* Template Preview */}
                            <div
                                className="h-24 rounded mb-3 overflow-hidden relative"
                                style={{
                                    background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})`
                                }}
                            >
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="invoice-scroll-content group-hover:animate-scroll">
                                        <div className="bg-white text-black p-2 text-xs min-h-96">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="font-bold text-lg" style={{ color: template.colors.primary }}>{t('INVOICE')}</div>
                                                    <div className="font-semibold">{t('Your Company')}</div>
                                                    <div className="text-gray-600 mt-1">
                                                        <div>123 Business St</div>
                                                        <div>City, State 12345</div>
                                                        <div>(555) 123-4567</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div>{t('Invoice')} #INV-001</div>
                                                    <div>{t('Date')}: {new Date().toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <div className="font-bold mb-2" style={{ color: template.colors.primary }}>{t('BILL TO')}:</div>
                                                <div>{t('Sample Client')}</div>
                                                <div>client@example.com</div>
                                            </div>

                                            <table className="w-full border-collapse mb-4">
                                                <thead>
                                                    <tr className="text-white" style={{ background: template.colors.primary }}>
                                                        <th className="text-left p-2">{t('Description')}</th>
                                                        <th className="text-right p-2">{t('Total')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr><td className="p-2 border">{t('Web Development')}</td><td className="text-right p-2 border">$750.00</td></tr>
                                                    <tr><td className="p-2 border">{t('Design Services')}</td><td className="text-right p-2 border">$250.00</td></tr>
                                                </tbody>
                                            </table>

                                            <div className="text-right mb-4">
                                                <div>{t('Subtotal')}: $1,000.00</div>
                                                <div>{t('Tax')}: $100.00</div>
                                                <div className="font-bold text-lg" style={{ color: template.colors.primary }}>{t('Total')}: $1,100.00</div>
                                            </div>

                                            <div className="text-center pt-4 border-t" style={{ borderColor: template.colors.primary }}>
                                                <div className="font-bold" style={{ color: template.colors.primary }}>{t('Thank you for your business!')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <style jsx>{`
                .invoice-scroll-content {
                  transform: translateY(0);
                  transition: transform 4s linear;
                }
                .group:hover .animate-scroll {
                  transform: translateY(-70%);
                }
              `}</style>

                            {/* Template Info */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-sm">{template.name}</h3>
                                {selectedTemplate === template.id && (
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                        <Check className="h-3 w-3 mr-1" />
                                        {t('Active')}
                                    </Badge>
                                )}
                            </div>

                            <p className="text-xs text-gray-600 mb-3">{template.description}</p>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={() => handlePreview(template.id)}
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    {t('Preview')}
                                </Button>

                                {selectedTemplate !== template.id && (
                                    <Button
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => handleSelectTemplate(template.id)}
                                    >
                                        {t('Select')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Preview Modal */}
                {previewTemplate && (
                    <Dialog open={!!previewTemplate} onOpenChange={closePreview}>
                        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>
                                    {templates.find(t => t.id === previewTemplate)?.name} {t('Template Preview')}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-y-auto pr-4">
                                <div className="bg-white border rounded-lg p-8 transform scale-75 origin-top">
                                    <InvoicePreview template={templates.find(t => t.id === previewTemplate)!} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={closePreview}>
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        handleSelectTemplate(previewTemplate);
                                        closePreview();
                                    }}
                                >
                                    {t('Select This Template')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    );
}

// Invoice Preview Component using your project's exact design
function InvoicePreview({ template }: { template: any }) {
    const { t } = useTranslation();

    // Sample invoice data for preview
    const sampleInvoice = {
        name: t('Sample Invoice'),
        description: t('This is a sample invoice for template preview'),
        invoice_number: 'INV-2024-001',
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        total_amount: 1100,
        subtotal: 1000,
        tax_amount: 100,
        account: {
            name: t('Sample Client'),
            email: 'client@example.com',
            phone: '(555) 123-4567'
        },
        billing_address: '456 Client Avenue',
        billing_city: 'Client City',
        billing_state: 'State',
        billing_postal_code: '67890',
        products: [
            {
                name: t('Web Development'),
                pivot: { quantity: 10, unit_price: 75, total_price: 750 },
                tax: { name: 'VAT', rate: 10 }
            },
            {
                name: t('Design Services'),
                pivot: { quantity: 5, unit_price: 50, total_price: 250 },
                tax: { name: 'VAT', rate: 10 }
            }
        ],
        notes: t('Thank you for your business!')
    };

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{sampleInvoice.name}</h1>
                        <p className="text-base text-gray-600 mt-2 leading-relaxed max-w-3xl">{sampleInvoice.description}</p>
                    </div>
                    <div className="text-right ml-6">
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20">
                            {t('Draft')}
                        </span>
                        <p className="text-sm font-medium text-gray-700 mt-2 font-mono">{sampleInvoice.invoice_number}</p>
                    </div>
                </div>
            </div>

            {/* Billing Details */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b px-8 py-6" style={{ backgroundColor: `${template.colors.primary}25` }}>
                    <h3 className="text-xl font-bold text-gray-800">{t('Billing Details')}</h3>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-5 h-5 mr-2" style={{ color: template.colors.primary }}>📍</span>
                                {t('Bill To')}
                            </h4>
                            <div className="space-y-2">
                                <p className="font-semibold text-gray-900 text-lg">{sampleInvoice.account.name}</p>
                                <p className="text-gray-600">{sampleInvoice.account.email}</p>
                                <p className="text-gray-600">{sampleInvoice.account.phone}</p>
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-700">{sampleInvoice.billing_address}</p>
                                    <p className="text-gray-700">{sampleInvoice.billing_city}, {sampleInvoice.billing_state} {sampleInvoice.billing_postal_code}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-5 h-5 mr-2" style={{ color: template.colors.primary }}>📅</span>
                                {t('Invoice Details')}
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-600 font-medium">{t('Invoice Date')}:</span>
                                    <span className="font-semibold text-gray-900">{formatDate(sampleInvoice.invoice_date)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-600 font-medium">{t('Due Date')}:</span>
                                    <span className="font-semibold text-gray-900">{formatDate(sampleInvoice.due_date)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 border-b px-8 py-6">
                    <h3 className="text-xl font-bold text-gray-800">{t('Products')}</h3>
                </div>
                <div className="p-0">
                    <div className="overflow-hidden">
                        <table className="min-w-full">
                            <thead>
                                <tr style={{ backgroundColor: template.colors.primary }}>
                                    <th className="text-base font-bold text-white py-4 px-6 w-1/3 text-left">{t('Product')}</th>
                                    <th className="text-right text-base font-bold text-white py-4 px-4">{t('Quantity')}</th>
                                    <th className="text-right text-base font-bold text-white py-4 px-4">{t('Unit Price')}</th>
                                    <th className="text-right text-base font-bold text-white py-4 px-4">{t('Tax')}</th>
                                    <th className="text-right text-base font-bold text-white py-4 px-4 w-1/6">{t('Total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sampleInvoice.products.map((product: any, index: number) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="font-semibold text-base text-gray-900 py-4 px-6">{product.name}</td>
                                        <td className="text-right text-base font-medium py-4 px-4">{product.pivot.quantity}</td>
                                        <td className="text-right text-base font-semibold py-4 px-4">{formatCurrency(product.pivot.unit_price)}</td>
                                        <td className="text-right text-base py-4 px-4">
                                            <div className="text-base">
                                                <div className="font-semibold text-gray-700">{product.tax.name}</div>
                                                <div className="text-gray-600 font-medium">({product.tax.rate}%)</div>
                                            </div>
                                        </td>
                                        <td className="text-right font-bold text-base py-4 px-4">
                                            <span className="text-green-600 font-semibold">{formatCurrency(product.pivot.total_price)}</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: `${template.colors.primary}10` }}>
                                    <td colSpan={4} className="text-right font-semibold text-base py-3 px-4" style={{ color: template.colors.primary }}>
                                        {t('Subtotal')}:
                                    </td>
                                    <td className="text-right font-semibold text-base py-3 px-4" style={{ color: template.colors.primary }}>
                                        {formatCurrency(sampleInvoice.subtotal)}
                                    </td>
                                </tr>
                                <tr style={{ backgroundColor: `${template.colors.primary}10` }}>
                                    <td colSpan={4} className="text-right font-semibold text-base py-3 px-4" style={{ color: template.colors.primary }}>
                                        {t('Total Tax')}:
                                    </td>
                                    <td className="text-right font-semibold text-base py-3 px-4" style={{ color: template.colors.primary }}>
                                        {formatCurrency(sampleInvoice.tax_amount)}
                                    </td>
                                </tr>
                                <tr className="border-t-2" style={{ backgroundColor: `${template.colors.primary}15`, borderTopColor: template.colors.primary }}>
                                    <td colSpan={4} className="text-right font-bold text-lg py-4 px-4" style={{ color: template.colors.primary }}>
                                        {t('Grand Total')}:
                                    </td>
                                    <td className="text-right py-4 px-4">
                                        <span className="font-bold text-xl" style={{ color: template.colors.primary }}>{formatCurrency(sampleInvoice.total_amount)}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {sampleInvoice.notes && (
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="border-b px-8 py-6" style={{ backgroundColor: `${template.colors.primary}25` }}>
                        <h3 className="text-xl font-bold text-gray-800">{t('Additional Information')}</h3>
                    </div>
                    <div className="p-8">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Notes')}</label>
                            <p className="text-base text-gray-700 mt-2 leading-relaxed">{sampleInvoice.notes}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
