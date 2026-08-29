<?php

namespace App\Console\Commands;

use App\Enums\DiscountType;
use App\Models\GrnItem;
use Illuminate\Console\Command;

class BackfillGrnItemPrices extends Command
{
    protected $signature = 'grn:backfill-item-prices';

    protected $description = 'Backfill new_cost_price for existing GRN items that have no price set.';

    public function handle(): int
    {
        $items = GrnItem::query()->whereNull('new_cost_price')->orWhereNull('unit_cost_price')->get();

        $this->info("Backfilling prices for {$items->count()} GRN item(s)...");

        $bar = $this->output->createProgressBar($items->count());
        $bar->start();

        foreach ($items as $item) {
            $qty = (float) $item->quantity ?: 1;
            $freeQty = (float) ($item->free_qty ?? 0);
            $totalQty = $qty + $freeQty ?: 1;
            $unitPrice = (float) $item->unit_price;
            $discountType = $item->discount_type instanceof DiscountType
                ? $item->discount_type->value
                : (($item->discount_type === 'none' || ! $item->discount_type) ? null : (string) $item->discount_type);
            $discountValue = (float) ($item->discount_value ?? 0);
            $base = $qty * $unitPrice;
            $discountAmount = $this->calculateDiscount($base, $discountType, $discountValue);
            $newCostPrice = round(($base - $discountAmount) / $totalQty, 4);
            $packSize = (float) ($item->pack_size ?? 1) ?: 1;
            $unitCostPrice = round($newCostPrice / $packSize, 4);

            $item->update(['new_cost_price' => $newCostPrice, 'unit_cost_price' => $unitCostPrice]);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Done.');

        return self::SUCCESS;
    }

    private function calculateDiscount(float $lineTotal, ?string $discountType, float $discountValue): float
    {
        if (! $discountType) {
            return 0;
        }

        if ($discountType === DiscountType::Percentage->value) {
            return round(($lineTotal * $discountValue) / 100, 2);
        }

        if ($discountType === DiscountType::Fixed->value) {
            return min($discountValue, $lineTotal);
        }

        return 0;
    }
}
