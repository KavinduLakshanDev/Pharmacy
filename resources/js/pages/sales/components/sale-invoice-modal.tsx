import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type SaleItem = {
  id?: number;
  product?: { name?: string; sku?: string };
  description?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  total?: number;
  batch_no?: string;
  expiry_date?: string;
};

type Sale = {
  sale_no: string;
  sale_date: string;
  customer?: { name?: string; phone?: string; address?: string };
  branch?: { name?: string };
  payment_method?: string;
  sub_total?: number;
  discount_amount?: number;
  delivery_charge?: number;
  total_amount?: number;
  paid_amount?: number;
  balance_amount?: number;
  items?: SaleItem[];
  notes?: string;
};

type SaleInvoiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
};

export default function SaleInvoiceModal({ open, onOpenChange, sale }: SaleInvoiceModalProps) {
  const { t } = useTranslation();

  const companyName = window.appSettings?.companyName || window.appSettings?.appName || t('Company');
  const companyAddress = window.appSettings?.companyAddress || '';
  const companyPhone = window.appSettings?.companyPhone || '';
  const companyLogo = window.appSettings?.companyLogo || null;

  const formattedDate = (date?: string) => {
    if (!date) return '-';
    return window.appSettings?.formatDateTime?.(date, false) ?? new Date(date).toLocaleDateString();
  };

  const formatMoney = (value?: number) => {
    const amount = Number(value ?? 0);
    return window.appSettings?.formatCurrency?.(amount) ?? `Rs ${amount.toFixed(2)}`;
  };

  const items = useMemo(() => sale.items || [], [sale.items]);

  const printInvoice = () => {
    const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${companyName} - ${sale.sale_no}</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; color: #111827; }
    .container { max-width: 900px; margin: 0 auto; }
    .header, .footer { width: 100%; margin-bottom: 24px; }
    .logo { max-height: 60px; margin-bottom: 12px; }
    .title { font-size: 32px; font-weight: 700; letter-spacing: 0.04em; margin: 0 0 8px; }
    .subtitle { margin: 0; color: #4b5563; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 24px; }
    .panel { border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
    .panel-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; color: #6b7280; margin-bottom: 10px; }
    .panel-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    .table th, .table td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    .table th { background: #f8fafc; color: #111827; font-weight: 700; }
    .table tbody tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .summary { margin-top: 20px; width: 320px; margin-left: auto; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .summary-total { font-weight: 700; font-size: 16px; }
    .badge { display: inline-flex; padding: 6px 10px; border-radius: 9999px; background-color: #ecfdf5; color: #166534; font-size: 12px; font-weight: 700; }
    .section-label { margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="logo" />` : ''}
      <h1 class="title">${t('INVOICE')}</h1>
      <p class="subtitle">${companyAddress}${companyPhone ? ` | ${companyPhone}` : ''}</p>
    </div>

    <div class="grid">
      <div class="panel">
        <div class="panel-title">${t('Bill To')}</div>
        <div class="panel-row"><span>${t('Name')}</span><span>${sale.customer?.name || t('Walk-in Customer')}</span></div>
        <div class="panel-row"><span>${t('Phone')}</span><span>${sale.customer?.phone || '-'}</span></div>
        <div class="panel-row"><span>${t('Address')}</span><span>${sale.customer?.address || '-'}</span></div>
      </div>
      <div class="panel">
        <div class="panel-title">${t('Invoice Details')}</div>
        <div class="panel-row"><span>${t('Invoice No')}:</span><span>${sale.sale_no}</span></div>
        <div class="panel-row"><span>${t('Invoice Date')}:</span><span>${formattedDate(sale.sale_date)}</span></div>
        <div class="panel-row"><span>${t('Payment')}:</span><span>${(sale.payment_method || '-').toString().toUpperCase()}</span></div>
        <div class="panel-row"><span>${t('Branch')}:</span><span>${sale.branch?.name || '-'}</span></div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>${t('Sl.')}</th>
          <th>${t('Description')}</th>
          <th class="text-right">${t('Qty')}</th>
          <th class="text-right">${t('Rate')}</th>
          <th class="text-right">${t('Amount')}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => {
          const name = item.product?.name || item.description || '-';
          const sku = item.product?.sku ? ` (${item.product.sku})` : '';
          const qty = Number(item.quantity ?? 0);
          const rate = Number(item.unit_price ?? 0);
          const amount = Number(item.total ?? qty * rate);
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${name}${sku}</td>
              <td class="text-right">${qty}</td>
              <td class="text-right">${formatMoney(rate)}</td>
              <td class="text-right">${formatMoney(amount)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row"><span>${t('Subtotal')}</span><span>${formatMoney(sale.sub_total)}</span></div>
      <div class="summary-row"><span>${t('Discount')}</span><span>-${formatMoney(sale.discount_amount)}</span></div>
      ${Number(sale.delivery_charge || 0) > 0 ? `<div class="summary-row"><span>${t('Delivery Charge')}</span><span>+${formatMoney(sale.delivery_charge)}</span></div>` : ''}
      <div class="summary-row summary-total"><span>${t('Total')}</span><span>${formatMoney(sale.total_amount)}</span></div>
      <div class="summary-row"><span>${t('Paid')}</span><span>${formatMoney(sale.paid_amount)}</span></div>
      <div class="summary-row"><span>${t('Balance Due')}</span><span>${formatMoney(sale.balance_amount)}</span></div>
    </div>

    <div class="footer">
      <p class="section-label">${t('Payment Instructions')}</p>
      <p>${t('Please make payment to the account on file and keep this invoice for your records.')}</p>
      <div style="margin-top: 24px; font-size: 12px; color: #6b7280;">${t('Authorized Signatory')}</div>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) return;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-transparent shadow-none">
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200">
          <div className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-[0.2em] text-slate-900 uppercase">{t('INVOICE')}</h2>
              </div>
              <Button size="sm" variant="secondary" onClick={printInvoice}>
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Invoice')}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.5fr_1fr]">
              <div className="space-y-1">
                <div className="text-base font-semibold text-slate-900">{companyName}</div>
                <div className="text-sm text-slate-600">{companyAddress}</div>
                {companyPhone && <div className="text-sm text-slate-600">{t('Mobile')}: {companyPhone}</div>}
              </div>
              <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{t('Invoice No')}:</span>
                  <span className="font-semibold text-slate-900">{sale.sale_no}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{t('Invoice Date')}:</span>
                  <span className="font-semibold text-slate-900">{formattedDate(sale.sale_date)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{t('Customer')}:</span>
                  <span className="font-semibold text-slate-900">{sale.customer?.name || t('Walk-in Customer')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3 font-semibold">{t('Bill To')}</div>
                <div className="text-sm text-slate-900 font-semibold">{sale.customer?.name || t('Walk-in Customer')}</div>
                {sale.customer?.phone && <div className="text-sm text-slate-600 mt-1">{sale.customer.phone}</div>}
                {sale.customer?.address && <div className="text-sm text-slate-600 mt-1">{sale.customer.address}</div>}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3 font-semibold">{t('Payment Instructions')}</div>
                <div className="text-sm text-slate-900 font-medium">{t('Pay Cheque to')}</div>
                <div className="text-sm text-slate-900">{companyName}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.2em]">{t('Sl.')}</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.2em]">{t('Description')}</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.2em]">{t('Qty')}</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.2em]">{t('Rate')}</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.2em]">{t('Amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, index) => {
                    const qty = Number(item.quantity ?? 0);
                    const rate = Number(item.unit_price ?? 0);
                    const amount = Number(item.total ?? qty * rate);

                    return (
                      <TableRow key={item.id ?? index}>
                        <TableCell className="px-4 py-3 font-semibold">{index + 1}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-slate-900">{item.product?.name || item.description || '-'}</div>
                          {item.product?.sku && <div className="text-xs text-slate-500">{item.product.sku}</div>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">{qty}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{formatMoney(rate)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{formatMoney(amount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3 font-semibold">{t('Notes')}</div>
                <p className="text-sm text-slate-600">{sale.notes || t('No notes added.')}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>{t('Subtotal')}</span>
                  <span>{formatMoney(sale.sub_total)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>{t('Total Discount')}</span>
                  <span>-{formatMoney(sale.discount_amount)}</span>
                </div>
                {Number(sale.delivery_charge || 0) > 0 && (
                  <div className="flex justify-between text-sm text-slate-500 mb-2">
                    <span>{t('Delivery Charge')}</span>
                    <span>+{formatMoney(sale.delivery_charge)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between text-base font-semibold text-slate-900">
                  <span>{t('Total')}</span>
                  <span>{formatMoney(sale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 mt-2">
                  <span>{t('Paid')}</span>
                  <span>{formatMoney(sale.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-900 mt-2">
                  <span>{t('Balance Due')}</span>
                  <span>{formatMoney(sale.balance_amount)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">{t('Authorized Signatory')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
