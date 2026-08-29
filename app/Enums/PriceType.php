<?php

namespace App\Enums;

enum PriceType: string
{
    case SalesPrice = 'sales_price';
    case CostPrice = 'cost_price';
    case WholesalePrice = 'wholesale_price';
    case PurchasePrice = 'purchase_price';
    case RetailPrice = 'retail_price';

    /**
     * Return all backed values.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }
}
