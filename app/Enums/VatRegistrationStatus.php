<?php

namespace App\Enums;

/**
 * Supplier VAT registration status.
 */
enum VatRegistrationStatus: string
{
    case Registered = 'registered';
    case NotRegistered = 'not_registered';

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
