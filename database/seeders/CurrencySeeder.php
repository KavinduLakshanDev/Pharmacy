<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currencies = [
            ['name' => 'Sri Lankan Rupee', 'code' => 'LKR', 'symbol' => '₨', 'description' => 'Sri Lankan Rupee', 'is_default' => true],
            ['name' => 'US Dollar', 'code' => 'USD', 'symbol' => '$', 'description' => 'United States Dollar', 'is_default' => false],
            ['name' => 'Euro', 'code' => 'EUR', 'symbol' => '€', 'description' => 'Euro', 'is_default' => false],
            ['name' => 'British Pound', 'code' => 'GBP', 'symbol' => '£', 'description' => 'British Pound Sterling', 'is_default' => false],
            ['name' => 'Japanese Yen', 'code' => 'JPY', 'symbol' => '¥', 'description' => 'Japanese Yen', 'is_default' => false],
        ];

        foreach ($currencies as $currency) {
            Currency::firstOrCreate(
                ['code' => $currency['code'], 'name' => $currency['name']],
                $currency
            );
        }
    }
}
