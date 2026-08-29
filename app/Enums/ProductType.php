<?php

namespace App\Enums;

enum ProductType: string
{
    case FinishedProduct = 'Finished product';
    // case SemiFinished = 'Semi-finished';
    // case Service = 'Service';
    // case Consumable = 'Consumable';
    // case Asset = 'Asset';

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
