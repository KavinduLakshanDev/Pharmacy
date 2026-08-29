<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Grn;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CustomerReturn>
 */
class CustomerReturnFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'return_number' => sprintf(
                'CRN-%s-%06d',
                now()->format('Ymd'),
                fake()->unique()->numberBetween(1, 999999),
            ),
            'customer_id' => Customer::query()->create([
                'name' => fake()->name(),
                'code' => fake()->unique()->bothify('CUST-#####'),
            ])->id,
            'grn_id' => Grn::factory(),
            'branch_id' => null,
            'return_date' => fake()->date(),
            'notes' => fake()->optional()->sentence(),
            'status' => fake()->randomElement(['pending', 'approved', 'processed', 'cancelled']),
            'sub_total' => fake()->randomFloat(2, 10, 500),
            'total_amount' => fake()->randomFloat(2, 10, 500),
            'invoice_return_credit' => 0,
            'exchange_purchase_amount' => 0,
            'customer_additional_payment_due' => 0,
            'customer_credit_after_exchange' => 0,
            'created_by' => User::factory(),
        ];
    }
}
