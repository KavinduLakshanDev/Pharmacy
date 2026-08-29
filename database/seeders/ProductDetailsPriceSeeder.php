<?php

namespace Database\Seeders;

use App\Enums\PriceType;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductDetailsPriceSeeder extends Seeder
{
    public function run(): void
    {
        // Avoid global soft-delete scope in case the database doesn't yet have a deleted_at column.
        $products = Product::withoutGlobalScopes()->get();

        foreach ($products as $product) {
            $base = (float) $product->price;

            $prices = [
                PriceType::SalesPrice->value => $base,
                PriceType::CostPrice->value => round($base * 0.7, 2),
                PriceType::WholesalePrice->value => round($base * 0.9, 2),
            ];

            foreach ($prices as $type => $price) {
                $product->detailsPrices()->updateOrCreate([
                    'price_type' => $type,
                ], [
                    'price' => $price,
                ]);
            }
        }

        $this->command->info('Product details prices seeded.');
    }
}
