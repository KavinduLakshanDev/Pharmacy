<?php

namespace App\Enums;

enum StockTransferStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public static function values(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }
}
