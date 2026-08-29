<?php

namespace App\Enums;

/**
 * Discount type for line items.
 */
enum DiscountType: string
{
    case Fixed = 'fixed';
    case Percentage = 'percentage';

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
