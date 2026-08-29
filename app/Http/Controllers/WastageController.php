<?php

namespace App\Http\Controllers;

use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\WastageStatus;
use App\Http\Requests\WastageRequest;
use App\Models\Branch;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\Wastage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WastageController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $query = Wastage::query()
            ->with(['branch:id,name', 'creator:id,name', 'approver:id,name'])
            ->where('created_by', createdBy())
            ->latest('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($builder) use ($search): void {
                $builder->where('wastage_no', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->string('branch_id')->toString());
        }

        $wastages = $query->paginate($request->integer('per_page', 15))->withQueryString();

        return Inertia::render('inventory/wastages/index', [
            'wastages' => $wastages,
            'branches' => Branch::query()->where('created_by', createdBy())->select('id', 'name')->get(),
            'filters' => $request->all(['search', 'status', 'branch_id', 'per_page']),
        ]);
    }

    public function create(): \Inertia\Response
    {
        $branches = Branch::query()->where('created_by', createdBy())->select('id', 'name')->get();

        $products = Product::query()
            ->where('created_by', createdBy())
            ->with('detailsPrices')
            ->select('id', 'name', 'sku', 'price')
            ->get();

        $products->each->append('cost_price');

        $grnItemData = GrnItem::query()
            ->whereNotNull('batch_no')
            ->select('product_id', 'batch_no', 'pack_size', 'unit_cost_price')
            ->orderByDesc('id')
            ->get()
            ->unique(fn ($item) => $item->product_id.'|'.$item->batch_no)
            ->keyBy(fn ($item) => $item->product_id.'|'.$item->batch_no);

        $batchStock = MasterTransaction::query()
            ->selectRaw(
                'product_id, stock_type_id as branch_id, batch_no, MAX(unit_price) as transaction_unit_price, SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as quantity',
                [MasterTransactionType::In->value],
            )
            ->where('status', MasterTransactionStatus::Completed->value)
            ->where('stock_type', MasterTransactionStockType::Branch->value)
            ->whereIn('stock_type_id', $branches->pluck('id'))
            ->whereNotNull('batch_no')
            ->groupBy('product_id', 'stock_type_id', 'batch_no')
            ->get()
            ->groupBy('branch_id')
            ->map(fn ($items) => $items->groupBy('product_id')->map(fn ($productItems, $productId) => $productItems->map(function ($item) use ($grnItemData, $productId) {
                $batchKey = $productId.'|'.$item->batch_no;
                $grnItem = $grnItemData->get($batchKey);
                $packSize = $grnItem?->pack_size !== null && $grnItem->pack_size !== ''
                    ? (float) $grnItem->pack_size
                    : null;
                $unitCostPrice = $grnItem?->unit_cost_price !== null
                    ? (float) $grnItem->unit_cost_price
                    : (float) $item->transaction_unit_price;
                $quantity = (float) $item->quantity;

                return [
                    'batch_no' => $item->batch_no,
                    'quantity' => $quantity,
                    'unit_price' => $unitCostPrice,
                    'pack_size' => $packSize,
                    'available_units' => $packSize ? round($quantity * $packSize) : $quantity,
                ];
            })->values()));

        return Inertia::render('inventory/wastages/create', [
            'branches' => $branches,
            'products' => $products,
            'batchStock' => $batchStock,
            'wastageNo' => Wastage::generateWastageNo(),
        ]);
    }

    public function store(WastageRequest $request): \Illuminate\Http\RedirectResponse
    {
        [$wastageData, $items] = $this->preparePayload($request->validated());

        $wastage = DB::transaction(function () use ($wastageData, $items): Wastage {
            $wastage = Wastage::query()->create(array_merge($wastageData, [
                'created_by' => createdBy(),
                'status' => WastageStatus::Pending->value,
            ]));

            $wastage->items()->createMany($items);
            $wastage->approve(auth()->id());

            return $wastage;
        });

        return redirect()->route('inventory.wastages.index')
            ->with('success', __('Wastage created successfully.'));
    }

    public function show(Wastage $wastage): \Inertia\Response
    {
        $this->ensureAccessible($wastage);

        $wastage->load(['branch:id,name', 'items.product', 'creator:id,name', 'approver:id,name']);

        return Inertia::render('inventory/wastages/show', [
            'wastage' => $wastage,
        ]);
    }

    public function approve(Wastage $wastage): \Illuminate\Http\RedirectResponse
    {
        $this->ensureAccessible($wastage);

        DB::transaction(function () use ($wastage): void {
            $wastage->approve(auth()->id());
        });

        return redirect()->route('inventory.wastages.index')
            ->with('success', __('Wastage approved successfully.'));
    }

    public function destroy(Wastage $wastage): \Illuminate\Http\Response
    {
        $this->ensureAccessible($wastage);

        DB::transaction(function () use ($wastage): void {
            $wastage->delete();
        });

        return response()->noContent();
    }

    private function ensureAccessible(Wastage $wastage): void
    {
        abort_unless((int) $wastage->created_by === (int) createdBy(), 404);
    }

    private function preparePayload(array $validated): array
    {
        $items = collect($validated['items'])->map(function (array $item): array {
            $quantity = round((float) $item['quantity'], 4);
            $unitPrice = round((float) $item['unit_price'], 4);

            return [
                'product_id' => $item['product_id'],
                'batch_no' => $item['batch_no'] ?? null,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => round($quantity * $unitPrice, 2),
            ];
        })->all();

        return [[
            'wastage_no' => $validated['wastage_no'],
            'branch_id' => $validated['branch_id'],
            'wastage_date' => $validated['wastage_date'],
            'status' => $validated['status'] ?? WastageStatus::Pending->value,
            'total_amount' => round(collect($items)->sum('total_price'), 2),
            'notes' => $validated['notes'] ?? null,
        ], $items];
    }
}
