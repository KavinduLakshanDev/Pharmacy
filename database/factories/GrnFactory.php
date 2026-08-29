<?php

namespace Database\Factories;

use App\Enums\GrnStatus;
use App\Models\Branch;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Grn>
 */
class GrnFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subTotal = $this->faker->randomFloat(2, 100, 10000);
        $discountAmount = $this->faker->optional()->randomFloat(2, 0, $subTotal * 0.2) ?? 0;
        $totalAmount = $subTotal - $discountAmount;

        $createdBy = User::factory()->create();

        $branchId = Branch::query()
            ->where('created_by', $createdBy->id)
            ->value('id')
            ?? Branch::create([
                'created_by' => $createdBy->id,
                'name' => 'Head Office',
                'address' => 'No. 100, Main Street',
                'phone' => '+000 000 0000',
                'email' => "headoffice-{$createdBy->id}@example.com",
                'status' => 'active',
            ])->id;

        return [
            'grn_no' => $this->faker->unique()->bothify('GRN-#####'),
            'batch_no' => $this->faker->optional()->bothify('BATCH-#####'),
            'sup_id' => Supplier::factory(),
            'branch_id' => $branchId,
            'created_by' => $createdBy->id,
            'grn_date' => $this->faker->date(),
            'sub_total' => $subTotal,
            'discount_amount' => $discountAmount,
            'total_amount' => $totalAmount,
            'paid_amount' => $this->faker->randomFloat(2, 0, $totalAmount),
            'description' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(GrnStatus::values()),
            'approved_by' => null,
            'approved_at' => null,
        ];
    }
}
