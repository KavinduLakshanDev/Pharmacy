<?php

namespace Database\Factories;

use App\Enums\DiscountType;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GrnItem>
 */
class GrnItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = $this->faker->randomFloat(2, 1, 20);
        $unitPrice = $this->faker->randomFloat(2, 1, 1000);
        $totalPrice = $quantity * $unitPrice;
        $discountType = $this->faker->optional()->randomElement(DiscountType::values());
        $discountValue = $discountType === DiscountType::Percentage->value
            ? $this->faker->randomFloat(2, 0, 30)
            : $this->faker->randomFloat(2, 0, $totalPrice);
        $discountAmount = $discountType === DiscountType::Percentage->value
            ? ($discountValue / 100) * $totalPrice
            : $discountValue;

        return [
            'product_id' => Product::factory(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'discount_amount' => $discountAmount,
        ];
    }
}
