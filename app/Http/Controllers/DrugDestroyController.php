<?php

namespace App\Http\Controllers;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Models\Branch;
use App\Models\DrugDestroy;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\SupplierReturnItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DrugDestroyController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $today = now()->toDateString();
        $cutoff = now()->addMonthsNoOverflow(3)->toDateString();
        $inType = MasterTransactionType::In->value;
        $outType = MasterTransactionType::Out->value;

        $query = MasterTransaction::query()
            ->join('products', 'products.id', '=', 'master_transactions.product_id')
            ->selectRaw('
                master_transactions.product_id,
                COALESCE(master_transactions.batch_no, \'\') as batch_no,
                master_transactions.stock_type_id as branch_id,
                products.name as product_name,
                products.sku as product_sku,
                products.pack_size as pack_size,
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,4)) ELSE 0 END) as qty_in,
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,4)) ELSE 0 END) as qty_out,
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,4)) ELSE 0 END) -
                SUM(CASE WHEN master_transactions.transaction_type = ? THEN CAST(master_transactions.quantity AS DECIMAL(15,4)) ELSE 0 END) as stock_in_hand
            ', [$inType, $outType, $inType, $outType])
            ->where('master_transactions.status', MasterTransactionStatus::Completed->value)
            ->where('master_transactions.created_by', createdBy())
            ->groupBy(
                'master_transactions.product_id',
                DB::raw('COALESCE(master_transactions.batch_no, \'\')'),
                'master_transactions.stock_type_id',
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
            ->addSelect('latest_grn_item.expiry_date as expiry_date')
            ->addSelect('latest_grn_item.unit_cost_price as unit_cost_price')
            ->addSelect(DB::raw('COALESCE(return_stats.return_count, 0) as supplier_return_count'))
            ->addSelect('return_stats.latest_return_date')
            ->groupBy('latest_grn_item.expiry_date', 'latest_grn_item.unit_cost_price', 'return_stats.return_count', 'return_stats.latest_return_date');

        $returnStats = SupplierReturnItem::query()
            ->join('supplier_returns', 'supplier_returns.id', '=', 'supplier_return_items.supplier_return_id')
            ->where('supplier_returns.created_by', createdBy())
            ->selectRaw('supplier_return_items.product_id, COALESCE(supplier_return_items.batch_no, \'\') as batch_no, COUNT(*) as return_count, MAX(supplier_returns.return_date) as latest_return_date')
            ->groupBy('supplier_return_items.product_id', DB::raw('COALESCE(supplier_return_items.batch_no, \'\')'));

        $query->leftJoinSub($returnStats, 'return_stats', function ($join) {
            $join->on('return_stats.product_id', '=', 'master_transactions.product_id')
                ->whereRaw("COALESCE(master_transactions.batch_no, '') = return_stats.batch_no");
        });

        $query->havingRaw('stock_in_hand > 0');
        $query->whereNotNull('latest_grn_item.expiry_date');
        $query->whereBetween('latest_grn_item.expiry_date', [$today, $cutoff]);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($sub) use ($search): void {
                $sub->where('products.name', 'like', "%{$search}%")
                    ->orWhere('products.sku', 'like', "%{$search}%")
                    ->orWhere('master_transactions.batch_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $query->where('master_transactions.stock_type', MasterTransactionStockType::Branch->value)
                ->where('master_transactions.stock_type_id', $request->branch_id);
        }

        $sortField = $request->get('sort_field', 'id');
        $sortDirection = $request->get('sort_direction', 'desc');
        $perPage = $request->get('per_page', 15);

        $stockRows = $query->orderBy($sortField, $sortDirection)->paginate($perPage);

        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('inventory/drug-destroys/index', [
            'stockRows' => $stockRows,
            'branches' => $branches,
            'filters' => $request->only(['search', 'branch_id', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'destroy_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.batch_no' => ['nullable', 'string'],
            'items.*.expiry_date' => ['nullable', 'date'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $createdByUserId = createdBy();
        $approvedByUserId = auth()->id();
        $destroyNumber = DrugDestroy::generateDestroyNumber();

        DB::transaction(function () use ($validated, $branchId, $createdByUserId, $approvedByUserId, $destroyNumber): void {
            $destroy = DrugDestroy::query()->create([
                'destroy_number' => $destroyNumber,
                'branch_id' => $branchId,
                'destroy_date' => $validated['destroy_date'],
                'notes' => $validated['notes'] ?? null,
                'total_amount' => 0,
                'created_by' => $createdByUserId,
                'approved_by' => $approvedByUserId,
                'approved_at' => now(),
            ]);

            $subTotal = 0;
            $recalculationScopes = [];

            foreach ($validated['items'] as $item) {
                $batchNo = $item['batch_no'] ?? null;
                $productId = $item['product_id'];
                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];

                $currentStockQuery = MasterTransaction::query()
                    ->where('product_id', $productId)
                    ->where('status', MasterTransactionStatus::Completed->value)
                    ->whereRaw('COALESCE(batch_no, ?) = ?', ['', $batchNo ?? '']);

                if ($branchId !== null) {
                    $currentStockQuery->where('stock_type', MasterTransactionStockType::Branch->value)
                        ->where('stock_type_id', $branchId);
                }

                $availableStock = (float) $currentStockQuery
                    ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity WHEN transaction_type = ? THEN -quantity ELSE 0 END) as stock', [MasterTransactionType::In->value, MasterTransactionType::Out->value])
                    ->value('stock');

                if ($availableStock < $quantity) {
                    abort(422, 'Requested destruction quantity exceeds available stock.');
                }

                $supplierReturnExists = SupplierReturnItem::query()
                    ->join('supplier_returns', 'supplier_returns.id', '=', 'supplier_return_items.supplier_return_id')
                    ->where('supplier_returns.created_by', createdBy())
                    ->where('supplier_return_items.product_id', $productId)
                    ->whereRaw('COALESCE(supplier_return_items.batch_no, ?) = ?', ['', $batchNo ?? ''])
                    ->exists();

                if ($supplierReturnExists) {
                    abort(422, 'A supplier return already exists for this batch.');
                }

                $totalPrice = round($quantity * $unitPrice, 2);
                $subTotal += $totalPrice;

                $destroy->items()->create([
                    'product_id' => $productId,
                    'batch_no' => $batchNo,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                ]);

                MasterTransaction::query()->create([
                    'product_id' => $productId,
                    'transaction_type' => MasterTransactionType::Out,
                    'transactionable_type' => MasterTransactionSourceType::DrugDestroy,
                    'transactionable_id' => $destroy->id,
                    'stock_type' => $branchId ? MasterTransactionStockType::Branch : null,
                    'stock_type_id' => $branchId,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'transaction_date' => $validated['destroy_date'],
                    'notes' => $validated['notes'] ?: "Drug destroy {$destroy->destroy_number}",
                    'batch_no' => $batchNo,
                    'status' => MasterTransactionStatus::Completed->value,
                    'created_by' => $createdByUserId,
                    'approved_by' => $approvedByUserId,
                    'approved_at' => now(),
                ]);

                $scopeKey = sprintf('%s|%s|%s', $productId, $branchId !== null ? MasterTransactionStockType::Branch->value : 'null', $branchId ?? 'null');
                $recalculationScopes[$scopeKey] = [
                    'productId' => $productId,
                    'stockType' => $branchId !== null ? MasterTransactionStockType::Branch->value : null,
                    'stockTypeId' => $branchId,
                ];
            }

            $destroy->update([
                'total_amount' => $subTotal,
            ]);

            foreach ($recalculationScopes as $scope) {
                MasterTransaction::recalculateLedgerForScope($scope['productId'], $scope['stockType'], $scope['stockTypeId']);
            }
        });

        return redirect()->route('inventory.drug-destroys.index')
            ->with('success', __('Destroyed stock recorded successfully.'));
    }
}
