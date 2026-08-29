<?php

namespace Database\Factories;

use App\Enums\StockTransferStatus;
use App\Models\Branch;
use App\Models\StockTransfer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockTransfer>
 */
class StockTransferFactory extends Factory
{
    protected $model = StockTransfer::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->create();

        return [
            'transfer_no' => StockTransfer::generateTransferNo(),
            'from_branch_id' => Branch::query()->create([
                'name' => 'From Branch',
                'created_by' => $user->id,
            ])->id,
            'to_branch_id' => Branch::query()->create([
                'name' => 'To Branch',
                'created_by' => $user->id,
            ])->id,
            'transfer_date' => now()->toDateString(),
            'total_amount' => 0,
            'notes' => null,
            'status' => StockTransferStatus::Pending,
            'created_by' => $user->id,
        ];
    }
}
