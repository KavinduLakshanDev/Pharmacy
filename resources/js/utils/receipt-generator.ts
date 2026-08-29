import { ReceiptData } from '@/pages/sales/components/pos-receipt';

export const generateReceiptHtml = (receiptData: ReceiptData, formatCurrency: (v: number) => string, companyName: string, companyLogo: string | null, companyAddress: string | null, companyPhone: string | null, branchAddress: string | null, t: any) => {
    const PAYMENT_LABEL: Record<string, string> = {
        cash: 'Cash',
        card: 'Card',
        bank_transfer: 'Bank Transfer',
        split: 'Split',
        mixed: 'Mixed',
    };

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

    const displayAddress = companyAddress || branchAddress;

    return `<!DOCTYPE html>
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
  ${displayAddress ? `<p class="center" style="font-size:11px;">${displayAddress}</p>` : ''}
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
  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p style="margin-top:4px;">Please come again.</p>
  </div>
</body>
</html>`;
};
