<?php

namespace App\Enums;

/**
 * Represents the logical location where stock is held/used.
 *
 * Used for optional polymorphic linking to outlets, vehicles, warehouses, etc.
 */
enum MasterTransactionStockType: string
{
    case Outlet = 'outlet';
    case DeliveryVehicle = 'delivery_vehicle';
    case Warehouse = 'warehouse';
    case Branch = 'branch';
    case Other = 'other';

    public static function values(): array
    {
        return array_map(static fn (self $stockType): string => $stockType->value, self::cases());
    }
}
