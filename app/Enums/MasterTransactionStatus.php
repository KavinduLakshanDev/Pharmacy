<?php

namespace App\Enums;

/**
 * Current approval/workflow state of a stock transaction.
 */
enum MasterTransactionStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public static function values(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }
}
