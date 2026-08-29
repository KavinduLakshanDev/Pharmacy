import { Printer, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { isElectron, printInElectron, getElectronPrinters } from '@/lib/electron-utils';
import { usePage } from '@inertiajs/react';

type SaleItem = {
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
};

export type ReceiptData = {
  saleNumber: string;
  date: string;
  customer: string;
  cashier: string;
  items: SaleItem[];
  subtotal: number;
  itemDiscount: number;
  orderDiscount: number;
  points_redeemed?: number;
  points_redeemed_amount?: number;
  points_earned?: number;
  customer_points_balance?: number;
  tax: number;
  total: number;
  paymentMode: string;
  cashAmount: number;
  cardAmount: number;
  bankAmount: number;
  totalPaid: number;
  changeDue: number;
  issuedBy?: string;
  checkedBy?: string;
  posSession: Record<string, unknown> | null;
  globalSettings: Record<string, unknown> | null;
};

type Props = {
  open: boolean;
  autoPrint?: boolean;
  onClose: () => void;
  onNewSale: () => void;
  receiptData: ReceiptData | null;
  formatCurrency: (v: number) => string;
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  split: 'Split',
  mixed: 'Mixed',
};

export function PosReceipt({ open, autoPrint, onClose, onNewSale, receiptData, formatCurrency }: Props) {
  const { t } = useTranslation();
  const { props } = usePage();
  const inertiaGlobalSettings = (props as any).globalSettings || {};
  const currentGlobalSettings = receiptData?.globalSettings || inertiaGlobalSettings;

  const receiptRef = useRef<HTMLDivElement>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(
    localStorage.getItem('qz_printer_name') || ''
  );
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);

  useEffect(() => {
    if (isElectron()) {
        getElectronPrinters().then(setAvailablePrinters);
    }
  }, []);

  useEffect(() => {
    if (open && autoPrint && receiptData) {
      // Small delay to ensure the component is rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, autoPrint, receiptData]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) return;

    if (event.key === 'Enter' && receiptData) {
      event.preventDefault();
      handlePrint();
    }

    if (event.key === 'F10') {
      event.preventDefault();
      onNewSale();
    }
  };

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [open, onNewSale, receiptData]);

  const resolveLogoUrl = (logo?: string): string | null => {
    if (!logo) {
      return null;
    }

    if (logo.startsWith('http')) {
      return logo;
    }

    const base = (window as any).appSettings?.imageUrl || (window as any).appSettings?.baseUrl || '';
    const separator = base.endsWith('/') || logo.startsWith('/') ? '' : '/';
    return `${base}${separator}${logo}`;
  };

  const getAppSetting = (key: string): string | null => {
    const appSettings = (window as any).appSettings;
    if (!appSettings) return null;
    const value = typeof appSettings.get === 'function' ? appSettings.get(key, null) : appSettings[key];
    return value != null ? String(value) : null;
  };

  const companyName =
    getAppSetting('companyName') ||
    getAppSetting('storeName') ||
    (currentGlobalSettings?.companyName as string) ||
    (currentGlobalSettings?.storeName as string) ||
    (receiptData?.posSession?.branch_name as string) ||
    'POS Sale';

  const companyLogoPath =
    getAppSetting('companyLogo') ||
    (currentGlobalSettings?.companyLogo as string) ||
    '';

  const companyLogo = resolveLogoUrl(companyLogoPath);
  const branchAddress =
    receiptData?.posSession && typeof receiptData.posSession.branch_address === 'string'
      ? receiptData.posSession.branch_address
      : '';

  const companyPhone =
    getAppSetting('companyPhone') ||
    (currentGlobalSettings?.companyPhone as string | undefined);
  const companyAddress =
    getAppSetting('companyAddress') ||
    (currentGlobalSettings?.companyAddress as string | undefined);

  const displayAddress = companyAddress || branchAddress;

  const handlePrint = async () => {
    if (!receiptData) return;

    const itemsHtml = receiptData.items
      .map(
        (item) => `
        <tr>
          <td style="padding:1px 0;width:50%;">${item.product_name}${item.product_sku ? ` <small>(${item.product_sku})</small>` : ''}</td>
          <td style="text-align:center;width:10%;">${item.quantity}</td>
          <td style="text-align:right;width:20%;">${formatCurrency(item.unit_price)}</td>
          <td style="text-align:right;width:20%;">${formatCurrency(item.line_total)}</td>
        </tr>
        ${item.discount_amount > 0 ? `<tr><td colspan="4" style="color:#000;font-size:10px;padding:0;">  Discount: -${formatCurrency(item.discount_amount)}</td></tr>` : ''}
      `,
      )
      .join('');

    const paymentLinesHtml = (() => {
      const lines: string[] = [];
      if (receiptData.paymentMode === 'cash' || receiptData.paymentMode === 'mixed' || receiptData.paymentMode === 'split') {
        if (receiptData.cashAmount > 0) lines.push(`<tr><td>Cash</td><td style="text-align:right;">${formatCurrency(receiptData.cashAmount)}</td></tr>`);
      }
      if (receiptData.paymentMode === 'card' || receiptData.paymentMode === 'mixed' || receiptData.paymentMode === 'split') {
        if (receiptData.cardAmount > 0) lines.push(`<tr><td>Card</td><td style="text-align:right;">${formatCurrency(receiptData.cardAmount)}</td></tr>`);
      }
      if (receiptData.paymentMode === 'bank_transfer' || receiptData.paymentMode === 'mixed' || receiptData.paymentMode === 'split') {
        if (receiptData.bankAmount > 0) lines.push(`<tr><td>Bank Transfer</td><td style="text-align:right;">${formatCurrency(receiptData.bankAmount)}</td></tr>`);
      }
      return lines.join('');
    })();

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size:14px; color:#000; width:72mm; padding:2mm; }
    h1 { font-size:16px; font-weight:bold; text-align:center; margin-bottom:2px; }
    .center { text-align:center; }
    .divider { border:none; border-top:1px dashed #000; margin:4px 0; }
    table { width:100%; border-collapse:collapse; table-layout: fixed; }
    td { vertical-align:top; overflow: hidden; word-wrap: break-word; }
    .total-row td { font-weight:bold; border-top:1px dashed #000; padding-top:3px; }
    .grand-total { font-size:18px; font-weight:bold; text-align:center; margin:6px 0; }
    .footer { text-align:center; margin-top:8px; font-size:12px; }
    @media print { body { width:72mm; margin:0; padding:2mm; } }
  </style>
</head>
<body>
  ${companyLogo ? `<div class="center"><img src="${companyLogo}" alt="${companyName}" style="max-height:60px; max-width:100%; margin:0 auto 4px;" /></div>` : ''}
  <h1>${companyName}</h1>
  ${companyAddress ? `<p class="center" style="font-size:11px;">${companyAddress}</p>` : ''}
  ${!companyAddress && branchAddress ? `<p class="center" style="font-size:11px;">${branchAddress}</p>` : ''}
  ${companyPhone ? `<p class="center" style="font-size:11px;">${companyPhone}</p>` : ''}
  ${receiptData.saleNumber ? `<p class="center" style="font-size:12px;font-weight:bold;">${t('Invoice No')}: ${receiptData.saleNumber}</p>` : ''}
  <hr class="divider" />
  <table>
    <tr><td>Date</td><td style="text-align:right;">${receiptData.date}</td></tr>
    <tr><td>Customer</td><td style="text-align:right;">${receiptData.customer}</td></tr>
  </table>
  <hr class="divider" />
  <table>
    <thead>
      <tr>
        <th style="text-align:left;width:50%;">Item</th>
        <th style="text-align:center;width:10%;">Qty</th>
        <th style="text-align:right;width:20%;">Price</th>
        <th style="text-align:right;width:20%;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr class="divider" />
  <table>
    <tr><td>Subtotal</td><td style="text-align:right;">${formatCurrency(receiptData.subtotal)}</td></tr>
    ${receiptData.itemDiscount > 0 ? `<tr><td>Item Discount</td><td style="text-align:right;">-${formatCurrency(receiptData.itemDiscount)}</td></tr>` : ''}
    ${receiptData.orderDiscount > 0 ? `<tr><td>Order Discount</td><td style="text-align:right;">-${formatCurrency(receiptData.orderDiscount)}</td></tr>` : ''}
    ${(receiptData.points_redeemed_amount ?? 0) > 0 ? `<tr><td>Points Redeemed (${Number(receiptData.points_redeemed ?? 0).toFixed(2)} pts)</td><td style="text-align:right;color:#059669;font-weight:bold;">-${formatCurrency(receiptData.points_redeemed_amount ?? 0)}</td></tr>` : ''}
    ${receiptData.tax > 0 ? `<tr><td>Tax</td><td style="text-align:right;">${formatCurrency(receiptData.tax)}</td></tr>` : ''}
    <tr class="total-row"><td>Total</td><td style="text-align:right;">${formatCurrency(receiptData.total)}</td></tr>
  </table>
  <div class="grand-total">${formatCurrency(receiptData.total)}</div>
  <hr class="divider" />
  <p style="font-size:10px;margin-bottom:2px;">Payment: ${PAYMENT_LABEL[receiptData.paymentMode] ?? receiptData.paymentMode}</p>
  <table style="font-size:11px;">
    ${paymentLinesHtml}
    ${receiptData.changeDue > 0.005 ? `<tr><td>Change</td><td style="text-align:right;font-weight:bold;color:#000;">${formatCurrency(receiptData.changeDue)}</td></tr>` : ''}
  </table>
  ${(receiptData.points_earned ?? 0) > 0 || (receiptData.customer_points_balance ?? 0) > 0 ? `
    <hr class="divider" />
    <table style="font-size:11px;">
      ${(receiptData.points_earned ?? 0) > 0 ? `<tr><td>Points Earned</td><td style="text-align:right;font-weight:bold;color:#059669;">+${Number(receiptData.points_earned ?? 0).toFixed(2)}</td></tr>` : ''}
      ${(receiptData.customer_points_balance ?? 0) > 0 ? `<tr><td>Updated Balance</td><td style="text-align:right;font-weight:bold;">${Number(receiptData.customer_points_balance ?? 0).toFixed(2)} pts</td></tr>` : ''}
    </table>
  ` : ''}
  <hr class="divider" />
  <hr class="divider" />
  <div style="font-size:10px;margin-top:4px;">
    ${receiptData.issuedBy ? `<p>Issued By: ${receiptData.issuedBy}</p>` : ''}
    ${receiptData.checkedBy ? `<p>Checked By: ${receiptData.checkedBy}</p>` : ''}
  </div>
  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p style="margin-top:4px;">Please come again.</p>
  </div>
</body>
</html>`;

    if (isElectron()) {
      try {
        await printInElectron(html, selectedPrinter);
        return;
      } catch (err: any) {
        console.error('Electron Print failed, falling back to browser print', err);
      }
    }

    const win = window.open('', '_blank', 'width=380,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => win.close(), 500);
    }, 500);
  };

  if (!open || !receiptData) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden w-[420px] max-w-[95vw] max-h-[90vh]">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold text-gray-800">{t('POS Receipt')}</span>
          </div>
          
          {isElectron() && availablePrinters.length > 0 && (
            <div className="flex items-center gap-1 bg-gray-50 rounded-md px-2 py-1 border border-gray-200 mr-2">
                <Printer className="h-3.5 w-3.5 text-gray-400" />
                <select 
                    className="bg-transparent border-none text-[11px] font-medium focus:ring-0 cursor-pointer"
                    value={selectedPrinter}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPrinter(val);
                        localStorage.setItem('qz_printer_name', val);
                    }}
                >
                    <option value="">{t('Default Printer')}</option>
                    {availablePrinters.map((p: any) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                </select>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div
            ref={receiptRef}
            className="mx-auto bg-white shadow-sm rounded-lg p-5 font-mono text-sm text-gray-800"
            style={{ width: '100%', maxWidth: '320px' }}
          >
            {/* Company header */}
            {companyLogo && (
              <div className="text-center mb-1">
                <img src={companyLogo} alt={String(companyName)} className="mx-auto h-10 object-contain" />
              </div>
            )}
            <div className="text-center font-bold text-base mb-0.5">{String(companyName)}</div>
            {displayAddress && (
              <div className="text-center text-xs text-gray-500 mb-1">{displayAddress}</div>
            )}
            {companyPhone && (
              <div className="text-center text-xs text-gray-500 mb-1">{String(companyPhone)}</div>
            )}
            {receiptData.saleNumber && (
              <div className="text-center text-xs text-gray-600 font-semibold mb-1">
                {t('Invoice No')}: {receiptData.saleNumber}
              </div>
            )}

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Meta */}
            <div className="space-y-0.5">
              <div className="flex justify-between"><span className="text-gray-500">{t('Date')}:</span><span>{receiptData.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('Customer')}:</span><span>{receiptData.customer}</span></div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Items */}
            <div className="space-y-1">
              {receiptData.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between">
                    <span className="flex-1 truncate">{item.product_name}</span>
                    <span className="ml-2 shrink-0">{formatCurrency(item.line_total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                    {item.discount_amount > 0 && <span className="text-primary">-{formatCurrency(item.discount_amount)}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Totals */}
            <div className="space-y-0.5">
              <div className="flex justify-between"><span className="text-gray-500">{t('Subtotal')}:</span><span>{formatCurrency(receiptData.subtotal)}</span></div>
              {receiptData.itemDiscount > 0 && (
                <div className="flex justify-between text-primary"><span>{t('Item Discount')}:</span><span>-{formatCurrency(receiptData.itemDiscount)}</span></div>
              )}
              {receiptData.orderDiscount > 0 && (
                <div className="flex justify-between text-primary"><span>{t('Order Discount')}:</span><span>-{formatCurrency(receiptData.orderDiscount)}</span></div>
              )}
              {(receiptData.points_redeemed_amount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold animate-in fade-in">
                  <span>{t('Points Redeemed')} ({Number(receiptData.points_redeemed ?? 0).toFixed(2)} pts):</span>
                  <span>-{formatCurrency(receiptData.points_redeemed_amount ?? 0)}</span>
                </div>
              )}
              {receiptData.tax > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">{t('Tax')}:</span><span>{formatCurrency(receiptData.tax)}</span></div>
              )}
              <div className="flex justify-between font-bold border-t border-dashed border-gray-400 mt-1 pt-1 text-sm">
                <span>{t('TOTAL')}:</span>
                <span>{formatCurrency(receiptData.total)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Payment */}
            <div className="space-y-0.5">
              <div className="flex justify-between"><span className="text-gray-500">{t('Payment')}:</span><span>{PAYMENT_LABEL[receiptData.paymentMode] ?? receiptData.paymentMode}</span></div>
              {receiptData.cashAmount > 0 && <div className="flex justify-between text-gray-500 text-xs"><span>{t('Cash')}:</span><span>{formatCurrency(receiptData.cashAmount)}</span></div>}
              {receiptData.cardAmount > 0 && <div className="flex justify-between text-gray-500 text-xs"><span>{t('Card')}:</span><span>{formatCurrency(receiptData.cardAmount)}</span></div>}
              {receiptData.bankAmount > 0 && <div className="flex justify-between text-gray-500 text-xs"><span>{t('Bank')}:</span><span>{formatCurrency(receiptData.bankAmount)}</span></div>}
              {receiptData.changeDue > 0.005 && (
                <div className="flex justify-between font-bold text-black"><span>{t('Change')}:</span><span>{formatCurrency(receiptData.changeDue)}</span></div>
              )}
            </div>

            {((receiptData.points_earned ?? 0) > 0 || (receiptData.customer_points_balance ?? 0) > 0) && (
              <>
                <div className="border-t border-dashed border-gray-400 my-2" />
                <div className="space-y-0.5 text-[11px]">
                  {(receiptData.points_earned ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>{t('Points Earned')}:</span>
                      <span>+{Number(receiptData.points_earned ?? 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(receiptData.customer_points_balance ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>{t('Updated Balance')}:</span>
                      <span>{Number(receiptData.customer_points_balance ?? 0).toFixed(2)} pts</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="text-xs text-gray-600 mb-2 space-y-0.5">
              {receiptData.issuedBy && <p>Issued By: {receiptData.issuedBy}</p>}
              {receiptData.checkedBy && <p>Checked By: {receiptData.checkedBy}</p>}
            </div>

            <div className="text-center text-xs text-gray-500 space-y-0.5">
              <p>{t('Thank you for your purchase!')}</p>
              <p>{t('Please come again.')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t bg-white px-5 py-3 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11"
            onClick={onNewSale}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t('New Sale')} (F10)
          </Button>
          <Button
            type="button"
            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            {t('Print Receipt')} (Enter)
          </Button>
        </div>
      </div>
    </div>
  );
}
