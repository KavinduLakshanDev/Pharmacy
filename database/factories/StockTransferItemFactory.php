<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockTransferItem>
 */
class StockTransferItemFactory extends Factory
{
    protected $model = StockTransferItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->randomFloat(4, 1, 20);
        $unitPrice = fake()->randomFloat(2, 5, 200);

        return [
            'stock_transfer_id' => StockTransfer::factory(),
            'product_id' => Product::factory(),
            'batch_no' => fake()->bothify('BATCH-###'),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'unit_cost_price' => null,
            'total_price' => round($quantity * $unitPrice, 2),
        ];
    }
}
