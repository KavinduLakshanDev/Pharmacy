<?php

namespace App\Enums;

/**
 * Transaction direction for stock tracking.
 *
 * - IN: stock is added to inventory (e.g., GRN, returns)
 * - OUT: stock is removed from inventory (e.g., usage, wastage)
 */
enum MasterTransactionType: string
{
    case In = 'IN';
    case Out = 'OUT';

    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }
}
