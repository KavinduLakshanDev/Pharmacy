<?php

namespace App\Enums;

/**
 * Goods Received Note (GRN) payment status.
 */
enum GrnStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

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
