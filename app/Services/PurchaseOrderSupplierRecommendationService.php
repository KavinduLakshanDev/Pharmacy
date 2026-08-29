<?php

namespace App\Services;

use App\Enums\GrnStatus;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\PurchaseOrder;
use App\Models\Supplier;

class PurchaseOrderSupplierRecommendationService
{
    /**
     * Recommend suppliers for the supplied products.
     *
     * @param  array<int>  $productIds
     * @return array<int, array<string, mixed>>
     */
    public function recommend(array $productIds, int $companyId): array
    {
        $productIds = array_values(array_unique(array_filter(array_map('intval', $productIds))));

        if ($productIds === []) {
            return [];
        }

        $priceHistory = $this->priceHistoryBySupplierAndProduct($productIds, $companyId);
        $deliveryHistory = $this->deliveryHistoryBySupplier($companyId);

        $candidateSuppliers = Supplier::query()
            ->where(function ($query) use ($priceHistory): void {
                $query->whereIn('id', array_keys($priceHistory));
            })
            ->select('id', 'company_name')
            ->orderBy('company_name')
            ->get();

        if ($candidateSuppliers->isEmpty()) {
            return [];
        }

        $recommendations = [];
        $costRanges = $this->costRangesByProduct($priceHistory);
        $deliveryRange = $this->deliveryRange($deliveryHistory);

        foreach ($candidateSuppliers as $supplier) {
            $supplierProductScores = [];
            $supplierReasons = [];

            foreach ($productIds as $productId) {
                $supplierPrice = $priceHistory[$supplier->id][$productId] ?? null;
                if ($supplierPrice === null) {
                    continue;
                }

                $range = $costRanges[$productId] ?? null;
                if ($range === null) {
                    continue;
                }

                [$minPrice, $maxPrice] = $range;
                $costScore = $this->normalizeInverse($supplierPrice, $minPrice, $maxPrice);

                $supplierProductScores[] = $costScore;
                $supplierReasons[] = sprintf('Product %d cost %.2f', $productId, $supplierPrice);
            }

            if ($supplierProductScores === []) {
                continue;
            }

            $avgCostScore = array_sum($supplierProductScores) / count($supplierProductScores);
            $deliveryScore = $this->normalizeInverse($deliveryHistory[$supplier->id] ?? null, $deliveryRange['min'] ?? null, $deliveryRange['max'] ?? null, true);

            $overallScore = round(($avgCostScore * 0.65) + ($deliveryScore * 0.35), 2);

            $recommendations[] = [
                'supplier_id' => $supplier->id,
                'supplier_name' => $supplier->company_name,
                'score' => $overallScore,
                'cost_score' => round($avgCostScore, 2),
                'delivery_score' => round($deliveryScore, 2),
                'average_delivery_days' => isset($deliveryHistory[$supplier->id]) ? round($deliveryHistory[$supplier->id], 2) : null,
                'reasons' => $this->buildReasons($supplier->id, $priceHistory, $deliveryHistory),
            ];
        }

        usort($recommendations, static fn (array $left, array $right): int => $right['score'] <=> $left['score']);

        return array_slice($recommendations, 0, 5);
    }

    /**
     * @param  array<int>  $productIds
     * @return array<int, array<int, float>>
     */
    private function priceHistoryBySupplierAndProduct(array $productIds, int $companyId): array
    {
        $history = [];

        Grn::query()
            ->where('created_by', $companyId)
            ->whereNotNull('sup_id')
            ->where('status', GrnStatus::Approved)
            ->with(['items' => function ($query) use ($productIds): void {
                $query->whereIn('product_id', $productIds);
            }])
            ->get()
            ->each(function (Grn $grn) use (&$history): void {
                foreach ($grn->items as $item) {
                    $price = $this->grnItemCostPrice($item);

                    if ($price <= 0) {
                        continue;
                    }

                    $history[$grn->sup_id][$item->product_id][] = $price;
                }
            });

        foreach ($history as $supplierId => $products) {
            foreach ($products as $productId => $prices) {
                $history[$supplierId][$productId] = array_sum($prices) / count($prices);
            }
        }

        return $history;
    }

    private function grnItemCostPrice(GrnItem $item): float
    {
        if ($item->new_cost_price !== null) {
            return (float) $item->new_cost_price;
        }

        if ($item->unit_cost_price !== null) {
            return (float) $item->unit_cost_price;
        }

        return (float) $item->unit_price;
    }

    /**
     * @return array<int, float>
     */
    private function deliveryHistoryBySupplier(int $companyId): array
    {
        $deliveryDays = [];

        PurchaseOrder::query()
            ->where('created_by', $companyId)
            ->whereNotNull('supplier_id')
            ->with('supplier:id,company_name')
            ->orderBy('order_date')
            ->get()
            ->each(function (PurchaseOrder $purchaseOrder) use (&$deliveryDays, $companyId): void {
                $grn = Grn::query()
                    ->where('created_by', $companyId)
                    ->where('sup_id', $purchaseOrder->supplier_id)
                    ->where('status', GrnStatus::Approved)
                    ->whereDate('grn_date', '>=', $purchaseOrder->order_date)
                    ->orderBy('grn_date')
                    ->first();

                if (! $grn || ! $purchaseOrder->order_date) {
                    return;
                }

                $days = $purchaseOrder->order_date->diffInDays($grn->grn_date);
                $deliveryDays[$purchaseOrder->supplier_id][] = $days;
            });

        foreach ($deliveryDays as $supplierId => $days) {
            $deliveryDays[$supplierId] = array_sum($days) / count($days);
        }

        return $deliveryDays;
    }

    /**
     * @param  array<int, array<int, float>>  $priceHistory
     * @return array<int, array{0: float, 1: float}>
     */
    private function costRangesByProduct(array $priceHistory): array
    {
        $ranges = [];

        $productPrices = [];
        foreach ($priceHistory as $supplierPrices) {
            foreach ($supplierPrices as $productId => $price) {
                $productPrices[$productId][] = $price;
            }
        }

        foreach ($productPrices as $productId => $prices) {
            $ranges[$productId] = [min($prices), max($prices)];
        }

        return $ranges;
    }

    /**
     * @param  array<int, float>  $deliveryHistory
     * @return array{min: ?float, max: ?float}
     */
    private function deliveryRange(array $deliveryHistory): array
    {
        if ($deliveryHistory === []) {
            return ['min' => null, 'max' => null];
        }

        return [
            'min' => min($deliveryHistory),
            'max' => max($deliveryHistory),
        ];
    }

    private function normalizeInverse(?float $value, ?float $min, ?float $max, bool $lowerIsBetter = false): float
    {
        if ($value === null || $min === null || $max === null) {
            return 50.0;
        }

        if (abs($max - $min) < 0.00001) {
            return 100.0;
        }

        if ($lowerIsBetter) {
            return round((($max - $value) / ($max - $min)) * 100, 2);
        }

        return round((($max - $value) / ($max - $min)) * 100, 2);
    }

    /**
     * @param  array<int, array<int, float>>  $priceHistory
     * @param  array<int, float>  $deliveryHistory
     * @return array<int, string>
     */
    private function buildReasons(int $supplierId, array $priceHistory, array $deliveryHistory): array
    {
        $reasons = [];

        if (isset($deliveryHistory[$supplierId])) {
            $reasons[] = sprintf('Average delivery time %.1f days', $deliveryHistory[$supplierId]);
        }

        $supplierPrices = $priceHistory[$supplierId] ?? [];
        foreach ($supplierPrices as $productId => $price) {
            $reasons[] = sprintf('Competitive cost for product %d at %.2f', $productId, $price);
        }

        return array_slice($reasons, 0, 3);
    }
}
