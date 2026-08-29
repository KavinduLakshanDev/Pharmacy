<?php

namespace App\Enums;

/**
 * Source document types that can create stock transactions.
 *
 * These values are stored in the DB (transactionable_type) and also used
 * to pick the reference number prefix.
 */
enum MasterTransactionSourceType: string
{
    case Grn = 'grn';
    case ProductionEntry = 'production_entry';
    case UsageNote = 'usage_note';
    case Wastage = 'wastage';
    case DrugDestroy = 'drug_destroy';
    case PurchaseOrder = 'purchase_order';
    case Sale = 'sale';
    case SalesOrder = 'sales_order';
    case ReceiptOrder = 'receipt_order';
    case DeliveryOrder = 'delivery_order';
    case StockTransfer = 'stock_transfer';
    case SupplierReturn = 'supplier_return';
    case CustomerReturn = 'customer_return';
    case Other = 'other';

    public function referencePrefix(): string
    {
        return match ($this) {
            self::Grn => 'GRN',
            self::ProductionEntry => 'PRD',
            self::UsageNote => 'USG',
            self::Wastage => 'WST',
            self::DrugDestroy => 'DDR',
            self::PurchaseOrder => 'PO',
            self::Sale => 'SAL',
            self::SalesOrder => 'SO',
            self::ReceiptOrder => 'RO',
            self::DeliveryOrder => 'DO',
            self::StockTransfer => 'ST',
            self::SupplierReturn => 'SRT',
            self::CustomerReturn => 'CRT',
            self::Other => 'TRX',
        };
    }

    public static function values(): array
    {
        return array_map(static fn (self $source): string => $source->value, self::cases());
    }
}
