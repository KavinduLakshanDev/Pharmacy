<?php

namespace Database\Factories;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionType;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MasterTransaction>
 */
class MasterTransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::query()->inRandomOrder()->value('id') ?? Product::query()->create([
                'name' => fake()->words(2, true),
                'sku' => strtoupper(fake()->bothify('PRD-####??')),
                'description' => fake()->sentence(),
                'price' => fake()->randomFloat(2, 1, 500),
                'stock_quantity' => 0,
                'status' => 'active',
                'created_by' => User::factory()->create()->id,
            ])->id,
            'transaction_type' => fake()->randomElement(MasterTransactionType::values()),
            'transactionable_type' => fake()->randomElement(MasterTransactionSourceType::values()),
            'transactionable_id' => fake()->numberBetween(1, 100000),
            'stock_type' => null,
            'stock_type_id' => null,
            'quantity' => fake()->numberBetween(1, 20),
            'unit_price' => fake()->randomFloat(2, 1, 500),
            'total_amount' => 0,
            'previous_stock' => 0,
            'current_stock' => 0,
            'reference_number' => null,
            'transaction_date' => now(),
            'notes' => fake()->sentence(),
            'status' => MasterTransactionStatus::Completed->value,
            'created_by' => User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id,
            'approved_by' => null,
            'approved_at' => null,
        ];
    }
}
