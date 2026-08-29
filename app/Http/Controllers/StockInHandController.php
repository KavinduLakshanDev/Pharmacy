<?php

namespace App\Http\Controllers;

use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Models\Branch;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockInHandController extends Controller
{
    /** Path segment when batch is empty (route `batch` uses pattern [^/]+, so "" is invalid for Ziggy). */
    public const EMPTY_BATCH_URL_SEGMENT = '__EMPTY_BATCH__';

    public function index(Request $request): \Inertia\Response
    {
        $perPage = min((int) $request->input('per_page', 15), 100);
        $inType = MasterTransactionType::In->value;
        $outType = MasterTransactionType::Out->value;
        $expiryStatus = $request->filled('expiry_status') && $request->string('expiry_status')->toString() !== 'all'
            ? $request->string('expiry_status')->toString()
            : null;
        $today = now()->toDateString();
        $shortExpiryCutoff = now()->addMonthsNoOverflow(3)->toDateString();

        $query = MasterTransaction::query()
            ->join('products', 'products.id', '=', 'master_transactions.product_id')
            ->selectRaw('
                master_transactions.product_id,
                COALESCE(master_transactions.batch_no, \'\') as batch_no,
                products.name as product_name,
                products.sku as product_sku,
                products.pack_size as pack_size,
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,2)) ELSE 0 END) as qty_in,
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,2)) ELSE 0 END) as qty_out,
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,2)) ELSE 0 END) -
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,2)) ELSE 0 END) as stock_in_hand
            ', [$inType, $outType, $inType, $outType])
            ->where('master_transactions.status', MasterTransactionStatus::Completed->value)
            ->where('master_transactions.created_by', createdBy())
            ->groupBy(
                'master_transactions.product_id',
                DB::raw('COALESCE(master_transactions.batch_no, \'\')'),
                'products.name',
                'products.sku',
                'products.pack_size',
            );

        $latestGrnItems = GrnItem::query()
            ->selectRaw('product_id, COALESCE(batch_no, \'\') as batch_no, MAX(grn_items.id) as latest_id')
            ->groupBy('product_id', DB::raw('COALESCE(batch_no, \'\')'));

        $query->leftJoinSub($latestGrnItems, 'latest_grn_batches', function ($join) {
            $join->on('latest_grn_batches.product_id', '=', 'master_transactions.product_id')
                ->whereRaw("COALESCE(master_transactions.batch_no, '') = latest_grn_batches.batch_no");
        })
            ->leftJoin('grn_items as latest_grn_item', 'latest_grn_item.id', '=', 'latest_grn_batches.latest_id')
            ->addSelect(DB::raw('latest_grn_item.expiry_date as expiry_date'))
            ->addSelect(DB::raw(
                "CASE
                    WHEN latest_grn_item.expiry_date IS NULL THEN 'no_expiry'
                    WHEN latest_grn_item.expiry_date <= '{$today}' THEN 'expired'
                    WHEN latest_grn_item.expiry_date <= '{$shortExpiryCutoff}' THEN 'short_expiry'
                    ELSE 'long_expiry'
                END as expiry_status"
            ))
            ->groupBy('latest_grn_item.expiry_date');

        if ($expiryStatus !== null) {
            $query->whereRaw(
                "CASE
                    WHEN latest_grn_item.expiry_date IS NULL THEN 'no_expiry'
                    WHEN latest_grn_item.expiry_date <= ? THEN 'expired'
                    WHEN latest_grn_item.expiry_date <= ? THEN 'short_expiry'
                    ELSE 'long_expiry'
                END = ?",
                [$today, $shortExpiryCutoff, $expiryStatus]
            );
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('master_transactions.batch_no', 'like', "%{$search}%")
                    ->orWhere('products.name', 'like', "%{$search}%")
                    ->orWhere('products.sku', 'like', "%{$search}%");
            });
        }

        if ($request->filled('product_id')) {
            $query->where('master_transactions.product_id', $request->product_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('master_transactions.stock_type', MasterTransactionStockType::Branch->value)
                ->where('master_transactions.stock_type_id', $request->branch_id);
        }

        if ($request->filled('batch_no')) {
            $batchFilter = $request->string('batch_no')->toString();
            $query->whereRaw('COALESCE(master_transactions.batch_no, ?) = ?', ['', $batchFilter]);
        }

        $stockRows = $query->paginate($perPage)->withQueryString();

        // Enrich each row with batch-specific new_cost_price, sale_price, and pack_size from grn_items
        if ($stockRows->isNotEmpty()) {
            // Latest grn_item per (product_id, batch_no) — most recent GRN wins
            $grnPrices = GrnItem::query()
                ->whereNotNull('batch_no')
                ->select('product_id', 'batch_no', 'new_cost_price', 'sale_price', 'unit_cost_price', 'pack_size')
                ->orderByDesc('id')
                ->get()
                ->unique(fn ($item) => $item->product_id.'|'.$item->batch_no)
                ->keyBy(fn ($item) => $item->product_id.'|'.$item->batch_no);

            $stockRows->getCollection()->transform(function ($row) use ($grnPrices) {
                $key = $row->product_id.'|'.$row->batch_no;
                $priceRow = $grnPrices->get($key);
                $row->cost_price = $priceRow?->new_cost_price !== null ? (float) $priceRow->new_cost_price : null;
                $row->sale_price = $priceRow?->sale_price !== null ? (float) $priceRow->sale_price : null;
                $row->unit_cost_price = $priceRow?->unit_cost_price !== null ? (float) $priceRow->unit_cost_price : null;
                // Override with batch-specific pack_size if available
                if ($priceRow?->pack_size !== null && $priceRow->pack_size !== '') {
                    $row->pack_size = $priceRow->pack_size;
                }

                $row->expiry_date = $row->expiry_date instanceof \DateTimeInterface
                    ? $row->expiry_date->format('Y-m-d')
                    : ($row->expiry_date !== null ? Carbon::parse((string) $row->expiry_date)->format('Y-m-d') : null);

                return $row;
            });
        }

        $products = Product::where('created_by', createdBy())
            ->select('id', 'name', 'sku')
            ->orderBy('name')
            ->get();

        $branches = Branch::where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $batchNos = MasterTransaction::query()
            ->where('created_by', createdBy())
            ->where('status', MasterTransactionStatus::Completed->value)
            ->selectRaw('DISTINCT COALESCE(batch_no, \'\') as bn')
            ->orderBy('bn')
            ->pluck('bn');

        return Inertia::render('stock-in-hand/index', [
            'stockRows' => $stockRows,
            'products' => $products,
            'branches' => $branches,
            'batchNos' => $batchNos,
            'filters' => $request->only(['search', 'product_id', 'branch_id', 'batch_no', 'expiry_status', 'per_page']),
        ]);
    }

    public function inventoryIndex(Request $request): \Inertia\Response
    {
        $expiryStatus = $request->filled('expiry_status') && $request->string('expiry_status')->toString() !== 'all'
            ? $request->string('expiry_status')->toString()
            : null;
        $today = now()->toDateString();
        $shortExpiryCutoff = now()->addMonthsNoOverflow(3)->toDateString();

        $query = MasterTransaction::query()
            ->with(['product:id,name,sku,pack_size'])
            ->whereIn('master_transactions.id', function ($subQuery) {
                $subQuery->selectRaw('MAX(master_transactions.id)')
                    ->from('master_transactions')
                    ->groupBy('product_id', 'stock_type', 'stock_type_id');
            })
            ->where('created_by', createdBy());

        $latestGrnItems = GrnItem::query()
            ->selectRaw('product_id, COALESCE(batch_no, \'\') as batch_no, MAX(grn_items.id) as latest_id')
            ->groupBy('product_id', DB::raw('COALESCE(batch_no, \'\')'));

        $query->leftJoinSub($latestGrnItems, 'latest_grn_batches', function ($join) {
            $join->on('latest_grn_batches.product_id', '=', 'master_transactions.product_id')
                ->whereRaw("COALESCE(master_transactions.batch_no, '') = latest_grn_batches.batch_no");
        })
            ->leftJoin('grn_items as latest_grn_item', 'latest_grn_item.id', '=', 'latest_grn_batches.latest_id')
            ->addSelect(DB::raw('latest_grn_item.expiry_date as expiry_date'))
            ->addSelect(DB::raw(
                "CASE
                    WHEN latest_grn_item.expiry_date IS NULL THEN 'no_expiry'
                    WHEN latest_grn_item.expiry_date <= '{$today}' THEN 'expired'
                    WHEN latest_grn_item.expiry_date <= '{$shortExpiryCutoff}' THEN 'short_expiry'
                    ELSE 'long_expiry'
                END as expiry_status"
            ))
            ->groupBy('latest_grn_item.expiry_date');

        if ($expiryStatus !== null) {
            $query->whereRaw(
                "CASE
                    WHEN latest_grn_item.expiry_date IS NULL THEN 'no_expiry'
                    WHEN latest_grn_item.expiry_date <= ? THEN 'expired'
                    WHEN latest_grn_item.expiry_date <= ? THEN 'short_expiry'
                    ELSE 'long_expiry'
                END = ?",
                [$today, $shortExpiryCutoff, $expiryStatus]
            );
        }

        if (filled($request->search)) {
            $search = trim((string) $request->search);
            $query->whereHas('product', function ($productQuery) use ($search): void {
                $productQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if (filled($request->stock_type) && $request->stock_type !== 'all') {
            $query->where('stock_type', $request->string('stock_type')->toString());
        }

        if (filled($request->branch_id) && $request->branch_id !== 'all') {
            $query->where('stock_type', 'branch')
                ->where('stock_type_id', $request->branch_id);
        }

        if (filled($request->batch_no) && $request->batch_no !== 'all') {
            $query->where('batch_no', $request->batch_no);
        }

        $currentTransactions = $query->get()->sortBy('product_id')->values();

        // Load latest pack_size per product_id from grn_items (most recent GRN wins)
        $productIds = $currentTransactions->pluck('product_id')->unique()->values()->all();
        $grnPackSizes = GrnItem::query()
            ->whereIn('product_id', $productIds)
            ->whereNotNull('pack_size')
            ->where('pack_size', '!=', '')
            ->select('product_id', 'pack_size')
            ->orderByDesc('id')
            ->get()
            ->unique('product_id')
            ->keyBy('product_id')
            ->map(fn ($item) => (float) $item->pack_size);

        if (! filled($request->branch_id) || $request->branch_id === 'all') {
            $rows = $currentTransactions->groupBy('product_id')
                ->map(function ($group) use ($grnPackSizes) {
                    $first = $group->first();
                    $packSize = $grnPackSizes->get($first->product_id) ?? ($first->product?->pack_size ? (float) $first->product->pack_size : null);
                    $currentStock = $group->sum(fn ($t) => (float) $t->current_stock);
                    $latestTransaction = $group->sortByDesc(
                        fn ($t) => $t->transaction_date?->getTimestamp() ?? $t->created_at?->getTimestamp() ?? 0
                    )->first();
                    $expiryDate = $latestTransaction->expiry_date instanceof \DateTimeInterface
                        ? $latestTransaction->expiry_date->format('Y-m-d')
                        : ($latestTransaction->expiry_date !== null ? Carbon::parse((string) $latestTransaction->expiry_date)->format('Y-m-d') : null);

                    return [
                        'product' => [
                            'id' => $first->product?->id,
                            'name' => $first->product?->name,
                            'sku' => $first->product?->sku,
                        ],
                        'current_stock' => $currentStock,
                        'pack_size' => $packSize,
                        'units_in_hand' => $packSize ? round($currentStock * $packSize) : $currentStock,
                        'stock_type' => 'all',
                        'transaction_date' => $latestTransaction->transaction_date?->format('Y-m-d') ?? $latestTransaction->created_at?->format('Y-m-d') ?? null,
                        'expiry_date' => $expiryDate,
                        'expiry_status' => $this->resolveExpiryStatus($expiryDate),
                    ];
                })
                ->values();
        } else {
            $rows = $currentTransactions->map(function ($transaction) use ($grnPackSizes) {
                $packSize = $grnPackSizes->get($transaction->product_id) ?? ($transaction->product?->pack_size ? (float) $transaction->product->pack_size : null);
                $currentStock = (float) $transaction->current_stock;
                $expiryDate = $transaction->expiry_date instanceof \DateTimeInterface
                    ? $transaction->expiry_date->format('Y-m-d')
                    : ($transaction->expiry_date !== null ? Carbon::parse((string) $transaction->expiry_date)->format('Y-m-d') : null);

                return [
                    'product' => [
                        'id' => $transaction->product?->id,
                        'name' => $transaction->product?->name,
                        'sku' => $transaction->product?->sku,
                    ],
                    'current_stock' => $currentStock,
                    'pack_size' => $packSize,
                    'units_in_hand' => $packSize ? round($currentStock * $packSize) : $currentStock,
                    'transaction_date' => $transaction->transaction_date?->format('Y-m-d') ?? $transaction->created_at?->format('Y-m-d') ?? null,
                    'expiry_date' => $expiryDate,
                    'expiry_status' => $this->resolveExpiryStatus($expiryDate),
                ];
            });
        }

        $perPage = max(1, (int) $request->integer('per_page', 15));
        $page = max(1, (int) $request->integer('page', 1));
        $offset = ($page - 1) * $perPage;

        $stockInHand = new LengthAwarePaginator(
            $rows->slice($offset, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            [
                'path' => route('inventory.stock-in-hand'),
                'query' => $request->query(),
            ]
        );

        $branches = Branch::where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $batchNos = MasterTransaction::query()
            ->where('created_by', createdBy())
            ->where('status', MasterTransactionStatus::Completed->value)
            ->selectRaw('DISTINCT COALESCE(batch_no, \'\') as bn')
            ->orderBy('bn')
            ->pluck('bn');

        return Inertia::render('inventory/stock-in-hand', [
            'stockInHand' => $stockInHand,
            'branches' => $branches,
            'batchNos' => $batchNos,
            'filters' => $request->only(['search', 'stock_type', 'branch_id', 'batch_no', 'expiry_status', 'per_page']),
        ]);
    }

    private function resolveExpiryStatus(?string $expiryDate): string
    {
        if (! $expiryDate) {
            return 'no_expiry';
        }

        $expiry = Carbon::parse($expiryDate)->startOfDay();
        $today = now()->startOfDay();
        $shortExpiryCutoff = now()->addMonthsNoOverflow(3)->startOfDay();

        if ($expiry->lessThanOrEqualTo($today)) {
            return 'expired';
        }

        if ($expiry->lessThanOrEqualTo($shortExpiryCutoff)) {
            return 'short_expiry';
        }

        return 'long_expiry';
    }

    public function show(Request $request, int $productId, string $batch): \Inertia\Response
    {
        $resolvedBatch = $batch === self::EMPTY_BATCH_URL_SEGMENT ? '' : $batch;

        $query = MasterTransaction::query()
            ->with('product:id,name,sku')
            ->where('product_id', $productId)
            ->where(function ($q) use ($resolvedBatch): void {
                if ($resolvedBatch === '') {
                    $q->whereNull('batch_no')->orWhere('batch_no', '');
                } else {
                    $q->where('batch_no', $resolvedBatch);
                }
            })
            ->where('created_by', createdBy());

        if ($request->filled('branch_id')) {
            $query->where('stock_type', MasterTransactionStockType::Branch)
                ->where('stock_type_id', $request->branch_id);
        }

        $transactions = $query->orderBy('id')->get();

        $product = Product::where('created_by', createdBy())
            ->select('id', 'name', 'sku')
            ->findOrFail($productId);

        $qtyIn = $transactions
            ->where('transaction_type', MasterTransactionType::In)
            ->sum(fn ($t) => (float) $t->quantity);

        $qtyOut = $transactions
            ->where('transaction_type', MasterTransactionType::Out)
            ->sum(fn ($t) => (float) $t->quantity);

        // Resolve batch-specific pack_size from grn_items, falling back to product pack_size
        $grnItem = GrnItem::query()
            ->where('product_id', $productId)
            ->where(function ($q) use ($resolvedBatch): void {
                if ($resolvedBatch === '') {
                    $q->whereNull('batch_no')->orWhere('batch_no', '');
                } else {
                    $q->where('batch_no', $resolvedBatch);
                }
            })
            ->whereNotNull('pack_size')
            ->orderByDesc('id')
            ->first();

        $packSize = $grnItem?->pack_size !== null ? (float) $grnItem->pack_size : null;

        $rows = $transactions->map(fn ($t) => [
            'id' => $t->id,
            'transaction_type' => $t->transaction_type->value,
            'source_type' => $t->transactionable_type?->value ?? '-',
            'reference_number' => $t->reference_number,
            'quantity' => (float) $t->quantity,
            'units' => $packSize ? round((float) $t->quantity * $packSize) : null,
            'unit_price' => (float) $t->unit_price,
            'total_amount' => (float) $t->total_amount,
            'previous_stock' => (float) $t->previous_stock,
            'current_stock' => (float) $t->current_stock,
            'previous_units' => $packSize ? round((float) $t->previous_stock * $packSize) : null,
            'current_units' => $packSize ? round((float) $t->current_stock * $packSize) : null,
            'transaction_date' => $t->transaction_date?->format('Y-m-d') ?? $t->created_at->format('Y-m-d'),
            'status' => $t->status?->value ?? '-',
        ]);

        $branch = $request->filled('branch_id')
            ? Branch::where('created_by', createdBy())->select('id', 'name')->find($request->branch_id)
            : null;

        return Inertia::render('stock-in-hand/show', [
            'product' => ['id' => $product->id, 'name' => $product->name, 'sku' => $product->sku],
            'batchNo' => $resolvedBatch,
            'packSize' => $packSize,
            'branch' => $branch ? ['id' => $branch->id, 'name' => $branch->name] : null,
            'summary' => [
                'qty_in' => $qtyIn,
                'qty_out' => $qtyOut,
                'stock_in_hand' => $qtyIn - $qtyOut,
                'units_in' => $packSize ? round($qtyIn * $packSize) : null,
                'units_out' => $packSize ? round($qtyOut * $packSize) : null,
                'units_in_hand' => $packSize ? round(($qtyIn - $qtyOut) * $packSize) : null,
            ],
            'transactions' => $rows,
        ]);
    }
}
