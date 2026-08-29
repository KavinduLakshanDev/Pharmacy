<?php

namespace App\Enums;

/**
 * Sale transaction status.
 */
enum SaleStatus: string
{
    case Draft = 'draft';
    case Completed = 'completed';
    case Partial = 'partial';
    case Cancelled = 'cancelled';

    /**
     * Return all backed values.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }
}
