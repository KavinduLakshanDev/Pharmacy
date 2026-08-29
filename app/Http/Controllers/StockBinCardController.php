<?php

namespace App\Http\Controllers;

use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Models\Branch;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class StockBinCardController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedBranchId = $request->filled('branch_id') ? $request->integer('branch_id') : null;

        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $products = Product::query()
            ->where('created_by', createdBy())
            ->select('id', 'name', 'sku', 'stock_quantity', 'product_type', 'pack_size')
            ->with('unit:id,name')
            ->orderBy('name')
            ->get();

        $selectedProductId = $request->filled('product_id') ? (int) $request->product_id : null;
        $searchProductNotFound = false;

        if ($selectedProductId === null && $request->filled('search')) {
            $searchTerm = trim($request->string('search')->toString());
            if ($searchTerm !== '') {
                $like = '%'.addcslashes($searchTerm, '%_\\').'%';
                $match = Product::query()
                    ->where('created_by', createdBy())
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'like', $like)
                            ->orWhere('sku', 'like', $like);
                    })
                    ->orderByRaw('CASE WHEN LOWER(name) = LOWER(?) THEN 0 WHEN LOWER(name) LIKE ? THEN 1 ELSE 2 END', [
                        $searchTerm,
                        addcslashes(mb_strtolower($searchTerm), '%_\\').'%',
                    ])
                    ->orderBy('name')
                    ->first();

                if ($match !== null) {
                    $selectedProductId = $match->id;
                } else {
                    $searchProductNotFound = true;
                }
            }
        }

        $transactions = null;
        $selectedProduct = null;
        $openingBalance = 0;
        $currentStock = 0;

        if ($selectedProductId !== null) {
            $selectedProduct = Product::query()
                ->where('created_by', createdBy())
                ->select('id', 'name', 'sku', 'stock_quantity', 'product_type', 'pack_size')
                ->with('unit:id,name')
                ->find($selectedProductId);

            if ($selectedProduct !== null) {
                $grnPackByBatch = $this->grnPackSizeMapByBatch($selectedProductId);

                $baseTransactionQuery = MasterTransaction::query()
                    ->where('product_id', $selectedProductId);

                if ($selectedBranchId !== null) {
                    $baseTransactionQuery
                        ->where('stock_type', MasterTransactionStockType::Branch->value)
                        ->where('stock_type_id', $selectedBranchId);
                }

                if ($request->filled('date_from')) {
                    $openingBalance = $this->sumSignedQuantityInUnits(
                        (clone $baseTransactionQuery)->whereDate('transaction_date', '<', $request->date('date_from')),
                        $selectedProduct,
                        $grnPackByBatch,
                    );
                }

                $currentStockQuery = clone $baseTransactionQuery;

                if ($request->filled('date_to')) {
                    $currentStockQuery->whereDate('transaction_date', '<=', $request->date('date_to'));
                }

                $currentStock = $this->sumSignedQuantityInUnits($currentStockQuery, $selectedProduct, $grnPackByBatch);

                $queryForRange = (clone $baseTransactionQuery)
                    ->with(['creator:id,name'])
                    ->orderBy('id');

                if ($request->filled('date_from')) {
                    $queryForRange->whereDate('transaction_date', '>=', $request->date('date_from'));
                }

                if ($request->filled('date_to')) {
                    $queryForRange->whereDate('transaction_date', '<=', $request->date('date_to'));
                }

                $allRows = $queryForRange->get();

                $runningBalance = $openingBalance;
                $decorated = $allRows->map(function (MasterTransaction $txn) use (&$runningBalance, $selectedProduct, $grnPackByBatch): MasterTransaction {
                    $packSize = $this->resolvePackSize($txn->batch_no, $selectedProduct, $grnPackByBatch);
                    $qtyPack = (float) $txn->quantity;
                    $qtyUnits = $qtyPack * $packSize;
                    $signedUnits = $txn->transaction_type === MasterTransactionType::In ? $qtyUnits : -$qtyUnits;
                    $runningBalance += $signedUnits;

                    $unitPricePack = (float) $txn->unit_price;
                    $unitPricePerUnit = $packSize > 0 ? $unitPricePack / $packSize : $unitPricePack;

                    $txn->setAttribute('pack_size', $packSize);
                    $txn->setAttribute('quantity_units', round($qtyUnits, 4));
                    $txn->setAttribute('unit_price_per_unit', round($unitPricePerUnit, 4));
                    $txn->setAttribute('current_stock', round($runningBalance, 4));

                    return $txn;
                });

                $perPage = max(1, $request->integer('per_page', 20));
                $page = max(1, $request->integer('page', 1));
                $total = $decorated->count();
                $slice = $decorated->slice(($page - 1) * $perPage, $perPage)->values();

                $transactions = new LengthAwarePaginator(
                    $slice,
                    $total,
                    $perPage,
                    $page,
                    [
                        'path' => $request->url(),
                        'query' => $request->query(),
                    ]
                );
                $transactions->withQueryString();
            }
        }

        $filters = $request->only(['branch_id', 'date_from', 'date_to', 'per_page']);
        if ($request->filled('search')) {
            $filters['search'] = $request->string('search')->toString();
        }
        if ($selectedProduct !== null) {
            $filters['product_id'] = $selectedProduct->id;
        }

        return Inertia::render('inventory/bin-card/index', [
            'products' => $products,
            'selectedProduct' => $selectedProduct,
            'openingBalance' => $openingBalance,
            'currentStock' => $currentStock,
            'transactions' => $transactions,
            'stockTypes' => MasterTransactionStockType::values(),
            'branches' => $branches,
            'filters' => $filters,
            'searchProductNotFound' => $searchProductNotFound,
        ]);
    }

    public function show(Request $request, int $productId, string $batch): Response
    {
        return Inertia::render('inventory/bin-card/index', [
            'products' => [],
            'selectedProduct' => null,
            'openingBalance' => 0,
            'currentStock' => 0,
            'transactions' => null,
            'stockTypes' => MasterTransactionStockType::values(),
            'branches' => [],
            'filters' => [],
            'searchProductNotFound' => false,
        ]);
    }

    /**
     * Latest GRN pack_size per batch for this product (same approach as stock-in-hand).
     *
     * @return Collection<string, float>
     */
    private function grnPackSizeMapByBatch(int $productId): Collection
    {
        return GrnItem::query()
            ->where('product_id', $productId)
            ->whereNotNull('batch_no')
            ->where('batch_no', '!=', '')
            ->whereNotNull('pack_size')
            ->where('pack_size', '!=', '')
            ->orderByDesc('id')
            ->get(['batch_no', 'pack_size'])
            ->unique('batch_no')
            ->mapWithKeys(fn (GrnItem $item): array => [
                (string) $item->batch_no => max((float) $item->pack_size, 0.0001),
            ]);
    }

    private function resolvePackSize(?string $batchNo, Product $product, Collection $grnPackByBatch): float
    {
        if (is_string($batchNo) && $batchNo !== '' && $grnPackByBatch->has($batchNo)) {
            return max((float) $grnPackByBatch->get($batchNo), 0.0001);
        }

        $productPack = $product->pack_size;
        if ($productPack !== null && $productPack !== '' && (float) $productPack > 0) {
            return max((float) $productPack, 0.0001);
        }

        return 1.0;
    }

    private function signedQuantityInUnits(MasterTransaction $txn, Product $product, Collection $grnPackByBatch): float
    {
        $packSize = $this->resolvePackSize($txn->batch_no, $product, $grnPackByBatch);
        $qtyPack = (float) $txn->quantity;
        $qtyUnits = $qtyPack * $packSize;

        return $txn->transaction_type === MasterTransactionType::In ? $qtyUnits : -$qtyUnits;
    }

    private function sumSignedQuantityInUnits($query, Product $product, Collection $grnPackByBatch): float
    {
        $sum = 0.0;
        foreach ($query->orderBy('id')->get() as $txn) {
            $sum += $this->signedQuantityInUnits($txn, $product, $grnPackByBatch);
        }

        return round($sum, 4);
    }
}
