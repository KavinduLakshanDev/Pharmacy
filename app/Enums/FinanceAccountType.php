<?php

namespace App\Enums;

enum FinanceAccountType: string
{
    case Cash = 'cash';
    case Bank = 'bank';
    case Card = 'card';
    case Wallet = 'wallet';
    case Online = 'online';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Bank => 'Bank',
            self::Card => 'Card',
            self::Wallet => 'Wallet',
            self::Online => 'Online',
        };
    }

    /**
     * @return array<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }

    /**
     * @return array<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(static fn (self $type): array => [
            'value' => $type->value,
            'label' => $type->label(),
        ], self::cases());
    }
}
