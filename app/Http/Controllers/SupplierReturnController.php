<?php

namespace App\Http\Controllers;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Supplier;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SupplierReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SupplierReturn::query()
            ->with([
                'supplier:id,company_name,contact_person_name',
                'grn:id,invoice_no,grn_no,grn_date',
                'branch:id,name',
            ])
            ->withCount('items')
            ->where('created_by', createdBy());

        if ($request->has('search') && $request->search !== null && trim($request->search) !== '') {
            $search = $request->search;
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('return_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($q) use ($search) {
                        $q->where('company_name', 'like', "%{$search}%")
                            ->orWhere('contact_person_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('grn', function ($q) use ($search) {
                        $q->where('invoice_no', 'like', "%{$search}%")
                            ->orWhere('grn_no', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }

        $sortField = $request->get('sort_field', 'id');
        $sortDirection = $request->get('sort_direction', 'desc');
        $perPage = $request->get('per_page', 10);

        $supplierReturns = $query->orderBy($sortField, $sortDirection)->paginate($perPage);

        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('inventory/supplier-returns/index', [
            'supplierReturns' => $supplierReturns,
            'branches' => $branches,
            'filters' => $request->only(['search', 'branch_id', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function create(): Response
    {
        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('inventory/supplier-returns/create', [
            'branches' => $branches,
        ]);
    }

    public function searchSuppliers(Request $request)
    {
        $search = trim($request->string('search')->toString());

        $suppliers = Supplier::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($builder) use ($search): void {
                    $builder->where('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_person_name', 'like', "%{$search}%")
                        ->orWhere('tel_no', 'like', "%{$search}%")
                        ->orWhere('mail', 'like', "%{$search}%");
                });
            })
            ->orderBy('company_name')
            ->limit(20)
            ->get();

        return response()->json($suppliers->map(function (Supplier $supplier) {
            return [
                'AdrKy' => $supplier->id,
                'AdrCd' => $supplier->company_name,
                'FstNm' => $supplier->company_name,
                'LstNm' => $supplier->contact_person_name,
                'TP1' => $supplier->tel_no,
                'Address' => $supplier->address,
            ];
        }));
    }

    public function supplierGrns(Supplier $supplier)
    {
        $grns = Grn::query()
            ->where('sup_id', $supplier->id)
            ->orderByDesc('grn_date')
            ->get(['id', 'invoice_no', 'grn_no', 'grn_date', 'total_amount']);

        return response()->json($grns->map(function (Grn $grn) {
            return [
                'id' => $grn->id,
                'invoice_no' => $grn->invoice_no ?: $grn->grn_no,
                'grn_no' => $grn->grn_no,
                'grn_date' => $grn->grn_date?->toDateString(),
                'total_amount' => $grn->total_amount,
            ];
        }));
    }

    public function grnDetails(Request $request, Grn $grn)
    {
        $grn->load(['items.product']);

        $branchId = $request->filled('branch_id') ? (int) $request->branch_id : null;

        $stockQuery = MasterTransaction::query()
            ->whereIn('product_id', $grn->items->pluck('product_id')->all())
            ->where('status', MasterTransactionStatus::Completed->value);

        if ($branchId !== null) {
            $stockQuery->where('stock_type', MasterTransactionStockType::Branch->value)
                ->where('stock_type_id', $branchId);
        }

        $stockLevels = $stockQuery
            ->selectRaw(
                'product_id, batch_no, COALESCE(SUM(CASE WHEN transaction_type = ? THEN quantity WHEN transaction_type = ? THEN -quantity ELSE 0 END), 0) as stock',
                [MasterTransactionType::In->value, MasterTransactionType::Out->value],
            )
            ->groupBy('product_id', 'batch_no')
            ->get()
            ->mapWithKeys(fn ($row) => [sprintf('%s::%s', $row->product_id, $row->batch_no) => (float) $row->stock]);

        // Load pack_size and unit_cost_price per (product_id, batch_no) from grn_items
        $grnItemData = \App\Models\GrnItem::query()
            ->whereNotNull('batch_no')
            ->select('product_id', 'batch_no', 'pack_size', 'unit_cost_price')
            ->orderByDesc('id')
            ->get()
            ->unique(fn ($item) => $item->product_id.'|'.$item->batch_no)
            ->keyBy(fn ($item) => sprintf('%s::%s', $item->product_id, $item->batch_no));

        return response()->json([
            'grn' => [
                'id' => $grn->id,
                'invoice_no' => $grn->invoice_no ?: $grn->grn_no,
                'grn_date' => $grn->grn_date?->toDateString(),
                'total_amount' => $grn->total_amount,
            ],
            'items' => $grn->items->map(function ($item) use ($stockLevels, $grnItemData) {
                $stockKey = sprintf('%s::%s', $item->product_id, $item->batch_no);
                $availableStock = $stockLevels[$stockKey] ?? (float) ($item->product?->stock_quantity ?? 0);
                $grnItemRow = $grnItemData->get($stockKey);
                $packSize = $grnItemRow?->pack_size !== null && $grnItemRow->pack_size !== ''
                    ? (float) $grnItemRow->pack_size
                    : null;
                $availableUnits = $packSize ? round($availableStock * $packSize) : $availableStock;
                $unitCostPrice = $grnItemRow?->unit_cost_price !== null
                    ? (float) $grnItemRow->unit_cost_price
                    : (float) $item->unit_price;

                return [
                    'grn_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name ?? 'N/A',
                    'quantity' => $item->quantity,
                    'available_stock' => $availableStock,
                    'available_units' => $availableUnits,
                    'pack_size' => $packSize,
                    'unit_cost_price' => $unitCostPrice,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price,
                    'batch_no' => $item->batch_no,
                    'expiry_date' => $item->expiry_date?->toDateString(),
                ];
            }),
        ]);
    }

    public function returnTarget(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'product_id' => ['required', 'exists:products,id'],
            'batch_no' => ['nullable', 'string'],
        ]);

        $batchNo = $validated['batch_no'] ?? '';
        $grnItem = GrnItem::query()
            ->where('product_id', $validated['product_id'])
            ->whereRaw('COALESCE(batch_no, ?) = ?', ['', $batchNo])
            ->whereHas('grn', function ($query) use ($validated) {
                if (array_key_exists('branch_id', $validated) && $validated['branch_id'] !== null) {
                    $query->where('branch_id', $validated['branch_id']);
                }
            })
            ->with('grn.supplier')
            ->orderByDesc('id')
            ->first();

        if (! $grnItem || ! $grnItem->grn || ! $grnItem->grn->supplier) {
            return response()->json([
                'supplier' => null,
                'grns' => [],
                'default_grn_id' => null,
                'branch_id' => $validated['branch_id'] ?? null,
            ]);
        }

        $supplier = $grnItem->grn->supplier;
        $grn = $grnItem->grn;

        return response()->json([
            'supplier' => [
                'AdrKy' => $supplier->id,
                'AdrCd' => $supplier->company_name,
                'FstNm' => $supplier->company_name,
                'LstNm' => $supplier->contact_person_name,
                'TP1' => $supplier->tel_no,
                'Address' => $supplier->address,
            ],
            'grns' => [
                [
                    'id' => $grn->id,
                    'invoice_no' => $grn->invoice_no ?: $grn->grn_no,
                    'grn_no' => $grn->grn_no,
                    'grn_date' => $grn->grn_date?->toDateString(),
                    'total_amount' => $grn->total_amount,
                ],
            ],
            'default_grn_id' => $grn->id,
            'branch_id' => $validated['branch_id'] ?? null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'grn_id' => ['required', 'exists:grns,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'return_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'products' => ['required', 'array', 'min:1'],
            'products.*.grn_item_id' => ['required', 'exists:grn_items,id'],
            'products.*.product_id' => ['required', 'exists:products,id'],
            'products.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'products.*.unit_price' => ['required', 'numeric', 'min:0'],
            'products.*.batch_no' => ['nullable', 'string'],
            'products.*.expiry_date' => ['nullable', 'date'],
        ]);

        $branchId = $validated['branch_id'] ?? null;

        if ($branchId === null) {
            $branchId = Grn::query()->whereKey($validated['grn_id'])->value('branch_id');
        }

        $branchId = $branchId !== null ? (int) $branchId : null;
        $createdByUserId = createdBy();
        $approvedByUserId = auth()->id();

        DB::transaction(function () use ($approvedByUserId, $branchId, $createdByUserId, $validated): void {
            $returnNumber = $this->generateReturnNumber();
            $subTotal = 0;

            $supplierReturn = SupplierReturn::create([
                'return_number' => $returnNumber,
                'supplier_id' => $validated['supplier_id'],
                'grn_id' => $validated['grn_id'],
                'branch_id' => $branchId,
                'return_date' => $validated['return_date'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'processed',
                'sub_total' => 0,
                'total_amount' => 0,
                'created_by' => $createdByUserId,
            ]);

            foreach ($validated['products'] as $index => $product) {
                $quantity = (float) $product['quantity'];
                $unitPrice = (float) $product['unit_price'];
                $totalPrice = $quantity * $unitPrice;
                $subTotal += $totalPrice;

                SupplierReturnItem::create([
                    'supplier_return_id' => $supplierReturn->id,
                    'grn_item_id' => $product['grn_item_id'],
                    'product_id' => $product['product_id'],
                    'quantity' => $product['quantity'],
                    'unit_price' => $product['unit_price'],
                    'total_price' => $totalPrice,
                    'batch_no' => $product['batch_no'] ?? null,
                    'expiry_date' => $product['expiry_date'] ?? null,
                ]);

                MasterTransaction::query()->create([
                    'product_id' => $product['product_id'],
                    'transaction_type' => MasterTransactionType::Out,
                    'transactionable_type' => MasterTransactionSourceType::SupplierReturn,
                    'transactionable_id' => $supplierReturn->id,
                    'stock_type' => $branchId ? MasterTransactionStockType::Branch : null,
                    'stock_type_id' => $branchId,
                    'quantity' => $product['quantity'],
                    'unit_price' => $product['unit_price'],
                    'transaction_date' => $validated['return_date'],
                    'notes' => $validated['notes'] ?: "Supplier return {$supplierReturn->return_number}",
                    'batch_no' => $product['batch_no'] ?? null,
                    'status' => MasterTransactionStatus::Completed,
                    'reference_number' => sprintf('%s-%02d', $supplierReturn->return_number, $index + 1),
                    'created_by' => $createdByUserId,
                    'approved_by' => $approvedByUserId,
                    'approved_at' => now(),
                ]);
            }

            $supplierReturn->update([
                'sub_total' => $subTotal,
                'total_amount' => $subTotal,
            ]);
        });

        return redirect()->route('inventory.supplier-returns.index')
            ->with('success', __('Supplier return recorded successfully.'));
    }

    private function generateReturnNumber(): string
    {
        $count = SupplierReturn::count() + 1;

        return sprintf('SRN-%s-%06d', now()->format('Ymd'), $count);
    }
}
