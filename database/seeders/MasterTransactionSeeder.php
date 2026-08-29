<?php

namespace Database\Seeders;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionType;
use App\Models\MasterTransaction;
use App\Models\Product;
use Illuminate\Database\Seeder;

class MasterTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::query()
            ->where('status', 'active')
            ->where('stock_quantity', '>', 0)
            ->orderBy('id')
            ->get();

        if ($products->isEmpty()) {
            $this->command?->warn('No active products with stock found. Skipping master transaction seeding.');

            return;
        }

        foreach ($products as $product) {
            $finalAvailableStock = (int) $product->stock_quantity;
            $outQuantity = $this->determineOutQuantity($finalAvailableStock);
            $openingInQuantity = $finalAvailableStock + $outQuantity;

            $openingSeedNote = sprintf('Seeded opening stock for product #%d', $product->id);
            $outSeedNote = sprintf('Seeded outbound stock for product #%d', $product->id);

            $openingTransaction = MasterTransaction::query()
                ->where('product_id', $product->id)
                ->where('notes', $openingSeedNote)
                ->first();

            if (! $openingTransaction) {
                $openingTransaction = MasterTransaction::query()->create([
                    'product_id' => $product->id,
                    'transaction_type' => MasterTransactionType::In,
                    'transactionable_type' => MasterTransactionSourceType::Grn,
                    'quantity' => $openingInQuantity,
                    'unit_price' => $product->price,
                    'transaction_date' => now()->subDays(14),
                    'notes' => $openingSeedNote,
                    'created_by' => $product->created_by,
                ]);
            }

            if ($outQuantity < 1) {
                continue;
            }

            $outboundTransaction = MasterTransaction::query()
                ->where('product_id', $product->id)
                ->where('notes', $outSeedNote)
                ->first();

            if (! $outboundTransaction) {
                MasterTransaction::query()->create([
                    'product_id' => $product->id,
                    'transaction_type' => MasterTransactionType::Out,
                    'transactionable_type' => $product->id % 2 === 0
                        ? MasterTransactionSourceType::UsageNote
                        : MasterTransactionSourceType::Wastage,
                    'quantity' => $outQuantity,
                    'unit_price' => $product->price,
                    'transaction_date' => now()->subDays(7),
                    'notes' => $outSeedNote,
                    'created_by' => $product->created_by,
                ]);
            }

            $product->refresh();

            if ((int) $product->stock_quantity !== $finalAvailableStock) {
                $product->update(['stock_quantity' => $finalAvailableStock]);
            }
        }

        $this->command?->info('Master transactions seeded for available products.');
    }

    private function determineOutQuantity(int $finalAvailableStock): int
    {
        if ($finalAvailableStock <= 1) {
            return 0;
        }

        return min(
            max(1, (int) floor($finalAvailableStock * 0.25)),
            10,
        );
    }
}
