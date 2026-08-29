<?php

namespace App\Http\Controllers;

use App\Enums\MasterTransactionType;
use App\Enums\ProductType;
use App\Enums\StockTransferStatus;
use App\Http\Requests\StockTransferRequest;
use App\Models\Branch;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $perPage = min((int) $request->input('per_page', 15), 100);

        $query = StockTransferItem::query()
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->join('products', 'products.id', '=', 'stock_transfer_items.product_id')
            ->join('branches as from_b', 'from_b.id', '=', 'stock_transfers.from_branch_id')
            ->join('branches as to_b', 'to_b.id', '=', 'stock_transfers.to_branch_id')
            ->select([
                'stock_transfer_items.id',
                'stock_transfers.id as transfer_id',
                'stock_transfers.transfer_no',
                'stock_transfers.transfer_date',
                'stock_transfers.status',
                'stock_transfers.from_branch_id',
                'stock_transfers.to_branch_id',
                'products.name as product_name',
                'products.sku as product_sku',
                'stock_transfer_items.batch_no',
                'stock_transfer_items.quantity',
                'stock_transfer_items.unit_price',
                'stock_transfer_items.total_price',
                'from_b.name as from_branch_name',
                'to_b.name as to_branch_name',
            ])
            ->where('stock_transfers.created_by', createdBy())
            ->whereNull('stock_transfer_items.deleted_at')
            ->whereNull('stock_transfers.deleted_at')
            ->latest('stock_transfer_items.id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search): void {
                $builder->where('stock_transfers.transfer_no', 'like', "%{$search}%")
                    ->orWhere('products.name', 'like', "%{$search}%")
                    ->orWhere('stock_transfer_items.batch_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('stock_transfers.status', $request->status);
        }

        if ($request->filled('from_branch_id') && $request->from_branch_id !== 'all') {
            $query->where('stock_transfers.from_branch_id', $request->from_branch_id);
        }

        if ($request->filled('to_branch_id') && $request->to_branch_id !== 'all') {
            $query->where('stock_transfers.to_branch_id', $request->to_branch_id);
        }

        $items = $query->paginate($perPage)->withQueryString();

        return Inertia::render('inventory/stock-transfers/index', [
            'items' => $items,
            'statuses' => StockTransferStatus::values(),
            'branches' => Branch::query()->where('created_by', createdBy())->select('id', 'name')->get(),
            'filters' => $request->all(['search', 'status', 'from_branch_id', 'to_branch_id', 'per_page']),
        ]);
    }

    public function create(): \Inertia\Response
    {
        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->get();

        $products = Product::query()
            ->where('created_by', createdBy())
            ->where('product_type', ProductType::FinishedProduct)
            ->select('id', 'name', 'sku', 'price', 'pack_size')
            ->get();

        $grnItemData = GrnItem::query()
            ->whereNotNull('batch_no')
            ->whereNotNull('pack_size')
            ->where('pack_size', '!=', '')
            ->select('product_id', 'batch_no', 'pack_size', 'unit_cost_price')
            ->orderByDesc('id')
            ->get()
            ->unique(fn ($item) => $item->product_id.'|'.$item->batch_no)
            ->keyBy(fn ($item) => $item->product_id.'|'.$item->batch_no);

        $grnPackSizes = $grnItemData->map(fn ($item) => (float) $item->pack_size);
        $grnUnitCostPrices = $grnItemData->map(fn ($item) => $item->unit_cost_price !== null ? (float) $item->unit_cost_price : null);

        $branchBatchStock = MasterTransaction::query()
            ->selectRaw(
                'product_id, stock_type_id as branch_id, batch_no, SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance',
                [MasterTransactionType::In->value],
            )
            ->where('stock_type', 'branch')
            ->whereIn('stock_type_id', $branches->pluck('id'))
            ->whereNotNull('batch_no')
            ->groupBy('product_id', 'stock_type_id', 'batch_no')
            ->get()
            ->groupBy('branch_id')
            ->map(function ($branchItems) use ($grnPackSizes, $grnUnitCostPrices) {
                return $branchItems->groupBy('product_id')->map(function ($productItems, $productId) use ($grnPackSizes, $grnUnitCostPrices) {
                    return $productItems->mapWithKeys(function ($item) use ($grnPackSizes, $grnUnitCostPrices, $productId) {
                        $packSize = $grnPackSizes->get($productId.'|'.$item->batch_no);
                        $unitCostPrice = $grnUnitCostPrices->get($productId.'|'.$item->batch_no);
                        $quantity = (float) $item->balance;

                        return [$item->batch_no => [
                            'balance' => $quantity,
                            'pack_size' => $packSize,
                            'available_units' => $packSize ? round($quantity * $packSize) : $quantity,
                            'unit_cost_price' => $unitCostPrice,
                        ]];
                    });
                });
            });

        return Inertia::render('inventory/stock-transfers/create', [
            'branches' => $branches,
            'products' => $products,
            'branchBatchStock' => $branchBatchStock,
            'statuses' => StockTransferStatus::values(),
            'transferNo' => StockTransfer::generateTransferNo(),
        ]);
    }

    public function store(StockTransferRequest $request): \Illuminate\Http\RedirectResponse
    {
        [$transferData, $items] = $this->preparePayload($request->validated());

        $transfer = DB::transaction(function () use ($transferData, $items): StockTransfer {
            $transfer = StockTransfer::query()->create(array_merge($transferData, [
                'created_by' => createdBy(),
                'status' => StockTransferStatus::Pending,
            ]));

            $transfer->items()->createMany($items);

            if (($transferData['status'] ?? null) === StockTransferStatus::Approved->value) {
                $transfer->approve(auth()->id());
            }

            return $transfer;
        });

        return redirect()->route('inventory.stock-transfers.index')
            ->with('success', __('Stock transfer created successfully.'));
    }

    public function show(StockTransfer $stockTransfer): \Inertia\Response
    {
        $this->ensureAccessible($stockTransfer);

        $stockTransfer->load(['fromBranch:id,name', 'toBranch:id,name', 'items.product', 'creator:id,name', 'approver:id,name']);

        return Inertia::render('inventory/stock-transfers/show', [
            'transfer' => $stockTransfer,
        ]);
    }

    public function edit(StockTransfer $stockTransfer): \Inertia\Response
    {
        $this->ensureAccessible($stockTransfer);
        $this->ensurePending($stockTransfer);

        $stockTransfer->load(['items.product']);

        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->get();

        $products = Product::query()
            ->where('created_by', createdBy())
            ->select('id', 'name', 'sku', 'price', 'pack_size')
            ->get();

        $grnItemData = GrnItem::query()
            ->whereNotNull('batch_no')
            ->whereNotNull('pack_size')
            ->where('pack_size', '!=', '')
            ->select('product_id', 'batch_no', 'pack_size', 'unit_cost_price')
            ->orderByDesc('id')
            ->get()
            ->unique(fn ($item) => $item->product_id.'|'.$item->batch_no)
            ->keyBy(fn ($item) => $item->product_id.'|'.$item->batch_no);

        $grnPackSizes = $grnItemData->map(fn ($item) => (float) $item->pack_size);
        $grnUnitCostPrices = $grnItemData->map(fn ($item) => $item->unit_cost_price !== null ? (float) $item->unit_cost_price : null);

        $branchBatchStock = MasterTransaction::query()
            ->selectRaw(
                'product_id, stock_type_id as branch_id, batch_no, SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance',
                [MasterTransactionType::In->value],
            )
            ->where('stock_type', 'branch')
            ->whereIn('stock_type_id', $branches->pluck('id'))
            ->whereNotNull('batch_no')
            ->groupBy('product_id', 'stock_type_id', 'batch_no')
            ->get()
            ->groupBy('branch_id')
            ->map(function ($branchItems) use ($grnPackSizes, $grnUnitCostPrices) {
                return $branchItems->groupBy('product_id')->map(function ($productItems, $productId) use ($grnPackSizes, $grnUnitCostPrices) {
                    return $productItems->mapWithKeys(function ($item) use ($grnPackSizes, $grnUnitCostPrices, $productId) {
                        $packSize = $grnPackSizes->get($productId.'|'.$item->batch_no);
                        $unitCostPrice = $grnUnitCostPrices->get($productId.'|'.$item->batch_no);
                        $quantity = (float) $item->balance;

                        return [$item->batch_no => [
                            'balance' => $quantity,
                            'pack_size' => $packSize,
                            'available_units' => $packSize ? round($quantity * $packSize) : $quantity,
                            'unit_cost_price' => $unitCostPrice,
                        ]];
                    });
                });
            });

        return Inertia::render('inventory/stock-transfers/edit', [
            'transfer' => $stockTransfer,
            'branches' => $branches,
            'products' => $products,
            'branchBatchStock' => $branchBatchStock,
            'statuses' => StockTransferStatus::values(),
        ]);
    }

    public function update(StockTransferRequest $request, StockTransfer $stockTransfer): \Illuminate\Http\RedirectResponse
    {
        $this->ensureAccessible($stockTransfer);
        $this->ensurePending($stockTransfer);

        [$transferData, $items] = $this->preparePayload($request->validated());

        $becameApproved = $stockTransfer->status !== StockTransferStatus::Approved
            && ($transferData['status'] ?? null) === StockTransferStatus::Approved->value;

        DB::transaction(function () use ($stockTransfer, $transferData, $items, $becameApproved): void {
            $stockTransfer->update($transferData);
            $stockTransfer->items()->delete();
            $stockTransfer->items()->createMany($items);

            if ($becameApproved) {
                $stockTransfer->approve(auth()->id());
            }
        });

        return redirect()->route('inventory.stock-transfers.index')
            ->with('success', __('Stock transfer updated successfully.'));
    }

    public function approve(StockTransfer $stockTransfer): \Illuminate\Http\RedirectResponse
    {
        $this->ensureAccessible($stockTransfer);

        DB::transaction(function () use ($stockTransfer): void {
            $stockTransfer->approve(auth()->id());
        });

        return redirect()->route('inventory.stock-transfers.index')
            ->with('success', __('Stock transfer approved successfully.'));
    }

    public function accept(StockTransfer $stockTransfer): \Illuminate\Http\RedirectResponse
    {
        $this->ensureAccessible($stockTransfer);

        DB::transaction(function () use ($stockTransfer): void {
            $stockTransfer->accept(auth()->id());
        });

        return redirect()->route('inventory.stock-transfers.index')
            ->with('success', __('Stock transfer accepted successfully.'));
    }

    public function reject(Request $request, StockTransfer $stockTransfer): \Illuminate\Http\RedirectResponse
    {
        $this->ensureAccessible($stockTransfer);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        DB::transaction(function () use ($stockTransfer, $validated): void {
            $stockTransfer->reject($validated['rejection_reason'], auth()->id());
        });

        return redirect()->route('inventory.stock-transfers.index')
            ->with('success', __('Stock transfer rejected successfully.'));
    }

    public function destroy(StockTransfer $stockTransfer): \Symfony\Component\HttpFoundation\Response
    {
        $this->ensureAccessible($stockTransfer);

        DB::transaction(function () use ($stockTransfer): void {
            $stockTransfer->delete();
        });

        return response()->noContent();
    }

    private function ensureAccessible(StockTransfer $transfer): void
    {
        abort_unless((int) $transfer->created_by === (int) createdBy(), 404);
    }

    private function ensurePending(StockTransfer $transfer): void
    {
        if ($transfer->status !== StockTransferStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => 'Only pending stock transfers can be modified.',
            ]);
        }
    }

    private function preparePayload(array $validated): array
    {
        $items = collect($validated['items'])->map(function (array $item): array {
            $quantity = round((float) $item['quantity'], 4);
            $unitPrice = round((float) $item['unit_price'], 2);
            $unitCostPrice = isset($item['unit_cost_price']) && $item['unit_cost_price'] !== null
                ? round((float) $item['unit_cost_price'], 2)
                : null;

            return [
                'product_id' => $item['product_id'],
                'batch_no' => $item['batch_no'] ?? null,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'unit_cost_price' => $unitCostPrice,
                'total_price' => round($quantity * $unitPrice, 2),
            ];
        })->all();

        return [[
            'transfer_no' => $validated['transfer_no'],
            'from_branch_id' => $validated['from_branch_id'],
            'to_branch_id' => $validated['to_branch_id'],
            'transfer_date' => $validated['transfer_date'],
            'status' => $validated['status'] ?? StockTransferStatus::Pending->value,
            'total_amount' => round(collect($items)->sum('total_price'), 2),
            'notes' => $validated['notes'] ?? null,
        ], $items];
    }
}
