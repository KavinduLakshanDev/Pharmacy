<?php

namespace App\Http\Controllers;

use App\Enums\DiscountType;
use App\Enums\GrnStatus;
use App\Enums\PriceType;
use App\Http\Requests\GrnRequest;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\Product;
use App\Models\ProductDetailsPrice;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GrnController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Grn::with(['supplier', 'items.product.unit']);

        if ($request->filled('search')) {
            $query->where('grn_no', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $grns = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 10));

        return Inertia::render('grns/index', [
            'grns' => $grns,
            'suppliers' => Supplier::select('id', 'company_name', 'address')->get(),
            'statuses' => GrnStatus::values(),
            'filters' => $request->all(['search', 'status', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('grns/create', [
            'suppliers' => Supplier::select('id', 'company_name', 'address')->get(),
            'branches' => Branch::where('created_by', createdBy())->select('id', 'name')->get(),
            'products' => Product::query()
                ->with(['unit', 'detailsPrices', 'genericName'], 'has_expiry')
                ->get(),
            'statuses' => GrnStatus::values(),
            'discountTypes' => DiscountType::values(),
            'nextGrnNo' => $this->generateGrnNo(now()->toDateString()),
            'nextBatchNo' => $this->generateBatchNo(now()->toDateString()),
        ]);
    }

    public function createFromPo(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['products.unit', 'products.detailsPrices', 'supplier']);

        return Inertia::render('grns/create', [
            'suppliers' => Supplier::select('id', 'company_name', 'address')->get(),
            'branches' => Branch::where('created_by', createdBy())->select('id', 'name')->get(),
            'products' => Product::query()
                ->with(['unit', 'detailsPrices', 'genericName'], 'has_expiry')
                ->get(),
            'statuses' => GrnStatus::values(),
            'discountTypes' => DiscountType::values(),
            'nextGrnNo' => $this->generateGrnNo(now()->toDateString()),
            'nextBatchNo' => $this->generateBatchNo(now()->toDateString()),
            'fromPurchaseOrder' => [
                'id' => $purchaseOrder->id,
                'sup_id' => $purchaseOrder->supplier_id,
                'items' => $purchaseOrder->products->map(function ($product) {
                    return [
                        'product_id' => $product->id,
                        'quantity' => $product->pivot->quantity,
                        'unit_price' => $product->pivot->unit_price,
                        'discount_type' => $product->pivot->discount_type ?? 'none',
                        'discount_value' => $product->pivot->discount_value ?? 0,
                        'pack_size' => $product->pack_size,
                    ];
                }),
            ],
        ]);
    }

    public function store(GrnRequest $request)
    {
        $data = $request->validated();
        $items = $data['items'] ?? [];
        unset($data['items']);

        // Ensure we have a GRN number and batch number
        $data['grn_no'] = $data['grn_no'] ?? $this->generateGrnNo($data['grn_date'] ?? '');
        $data['batch_no'] = $data['batch_no'] ?? $this->generateBatchNo($data['grn_date'] ?? '');

        $data['created_by'] = auth()->id();
        $data['branch_id'] = $data['branch_id'] ?? null;

        // If the GRN is approved at creation, record who approved it and when.
        if (($data['status'] ?? null) === GrnStatus::Approved->value) {
            $data['approved_by'] = auth()->id();
            $data['approved_at'] = now();
        }

        $grn = Grn::create($data);

        if (! empty($items)) {
            $grnDate = $data['grn_date'] ?? null;
            $grnBatchNo = $data['batch_no'] ?? $grn->batch_no ?? '';
            $productIds = collect($items)->pluck('product_id')->filter()->unique();
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($items as $index => $item) {
                if (empty($item['batch_no'])) {
                    $item['batch_no'] = $grnBatchNo ? sprintf('%s-%02d', $grnBatchNo, $index + 1) : null;
                }
                $grn->items()->create($this->prepareItemData($item, $products[$item['product_id']] ?? null, $grnDate));
            }
        }

        $grn->refresh();
        $grn->calculateTotals();
        $this->syncProductPrices($items);

        return redirect()->route('grns.index')->with('success', __('GRN created successfully.'));
    }

    public function show(Grn $grn)
    {
        $grn->load(['supplier', 'items.product.unit']);

        return Inertia::render('grns/show', [
            'grn' => $grn,
        ]);
    }

    public function edit(Grn $grn)
    {
        $grn->load(['supplier', 'items.product.unit', 'branch']);

        return Inertia::render('grns/edit', [
            'grn' => $grn,
            'suppliers' => Supplier::select('id', 'company_name', 'address')->get(),
            'branches' => Branch::where('created_by', createdBy())->select('id', 'name')->get(),
            'products' => Product::query()
                ->with(['unit', 'detailsPrices', 'genericName'], 'has_expiry')
                ->get(),
            'statuses' => GrnStatus::values(),
            'discountTypes' => DiscountType::values(),
        ]);
    }

    public function update(GrnRequest $request, Grn $grn)
    {
        $data = $request->validated();
        $items = $data['items'] ?? [];
        unset($data['items']);

        $data['branch_id'] = $data['branch_id'] ?? $grn->branch_id;

        $isApproving = ($data['status'] ?? null) === GrnStatus::Approved->value;

        if ($isApproving) {
            $data['approved_by'] = $grn->approved_by ?? auth()->id();
            $data['approved_at'] = $grn->approved_at ?? now();
        } else {
            $data['approved_by'] = null;
            $data['approved_at'] = null;
        }

        $grn->update($data);

        // Clear and re-create items to match payload
        $grn->items()->delete();

        if (! empty($items)) {
            $grnDate = $data['grn_date'] ?? null;
            $grnBatchNo = $data['batch_no'] ?? $grn->batch_no ?? '';
            $productIds = collect($items)->pluck('product_id')->filter()->unique();
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($items as $index => $item) {
                if (empty($item['batch_no'])) {
                    $item['batch_no'] = $grnBatchNo ? sprintf('%s-%02d', $grnBatchNo, $index + 1) : null;
                }
                $grn->items()->create($this->prepareItemData($item, $products[$item['product_id']] ?? null, $grnDate));
            }
        }

        $grn->refresh();
        $grn->calculateTotals();
        $this->syncProductPrices($items);

        return redirect()->route('grns.index')->with('success', __('GRN updated successfully.'));
    }

    public function destroy(Grn $grn)
    {
        $grn->delete();

        return redirect()->route('grns.index')->with('success', __('GRN deleted successfully.'));
    }

    public function nextNumber(Request $request): \Illuminate\Http\JsonResponse
    {
        $date = $request->get('date', now()->toDateString());

        return response()->json([
            'grn_no' => $this->generateGrnNo($date),
            'batch_no' => $this->generateBatchNo($date),
        ]);
    }

    private function generateGrnNo(string $date = ''): string
    {
        if (! $date) {
            $date = now()->toDateString();
        }

        $datePart = Carbon::parse($date)->format('md'); // e.g. "0320" for March 20
        $prefix = "GRN{$datePart}";

        do {
            $count = Grn::withTrashed()->where('grn_no', 'like', "{$prefix}%")->count() + 1;
            $grnNo = "{$prefix}{$count}";
        } while (Grn::withTrashed()->where('grn_no', $grnNo)->exists());

        return $grnNo;
    }

    private function generateBatchNo(string $date = ''): string
    {
        if (! $date) {
            $date = now()->toDateString();
        }

        $datePart = Carbon::parse($date)->format('md'); // e.g. "0320" for March 20
        $prefix = "BN{$datePart}";

        do {
            $count = Grn::withTrashed()->where('batch_no', 'like', "{$prefix}%")->count() + 1;
            $batchNo = "{$prefix}{$count}";
        } while (Grn::withTrashed()->where('batch_no', $batchNo)->exists());

        return $batchNo;
    }

    private function prepareItemData(array $item, ?Product $product = null, ?string $grnDate = null): array
    {
        $discountType = ($item['discount_type'] ?? null) === 'none' ? null : ($item['discount_type'] ?? null);
        $totalPrice = (float) ($item['quantity'] ?? 0) * (float) ($item['unit_price'] ?? 0);
        $discountAmount = $this->calculateDiscountAmount($totalPrice, $discountType, $item['discount_value'] ?? 0);

        $expiryDate = $item['expiry_date'] ?? null;

        // If the user didn't provide an expiry date, calculate it using the product's expiry days and the GRN date.
        if (! $expiryDate && $product && $grnDate) {
            $days = (int) ($product->expire_date ?? $product->expiry_days ?? 0);
            if ($days > 0) {
                try {
                    $expiryDate = Carbon::parse($grnDate)->addDays($days)->toDateString();
                } catch (\Exception $e) {
                    // Ignore parsing errors; leave expiry date null.
                }
            }
        }

        $salePrice = isset($item['sale_price']) && $item['sale_price'] !== null && $item['sale_price'] !== ''
            ? round((float) $item['sale_price'], 4)
            : null;

        // Automatically calculate sale price using profit margin if not provided
        if ($salePrice === null && $product && $product->profit_margin > 0) {
            $costPrice = (float) ($item['unit_price'] ?? 0);
            $salePrice = round($costPrice * (1 + ($product->profit_margin / 100)), 4);
        }

        return array_merge($item, [
            'discount_type' => $discountType,
            'total_price' => $totalPrice,
            'discount_amount' => $discountAmount,
            'expiry_date' => $expiryDate,
            'free_qty' => (float) ($item['free_qty'] ?? 0),
            'new_cost_price' => $this->computeNewCostPrice($item),
            'unit_cost_price' => $this->computeUnitCostPrice($item),
            'sale_price' => $salePrice,
            'unit_sales_price' => $this->computeUnitSalesPrice($salePrice, $item),
            'unit_stock' => $this->computeUnitStock($item),
        ]);
    }

    /**
     * Sync product cost and sale prices from GRN items into ProductDetailsPrice.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncProductPrices(array $items): void
    {
        foreach ($items as $item) {
            $productId = $item['product_id'] ?? null;

            if (! $productId) {
                continue;
            }

            $qty = (float) ($item['quantity'] ?? 1) ?: 1;
            $freeQty = (float) ($item['free_qty'] ?? 0);
            $totalQty = $qty + $freeQty ?: 1;
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $discountType = ($item['discount_type'] ?? null) === 'none' ? null : ($item['discount_type'] ?? null);
            $discountValue = (float) ($item['discount_value'] ?? 0);

            $base = $qty * $unitPrice;
            $discountAmount = $this->calculateDiscountAmount($base, $discountType, $discountValue);
            $discounted = $base - $discountAmount;

            // New cost price = discounted total / (qty + free_qty) so free items reduce per-unit cost
            $newCostPrice = $discounted / $totalQty;

            ProductDetailsPrice::updateOrCreate(
                ['product_id' => $productId, 'price_type' => PriceType::CostPrice->value],
                ['price' => round($newCostPrice, 4)]
            );

            if (isset($item['sale_price']) && $item['sale_price'] !== null && $item['sale_price'] !== '') {
                ProductDetailsPrice::updateOrCreate(
                    ['product_id' => $productId, 'price_type' => PriceType::SalesPrice->value],
                    ['price' => round((float) $item['sale_price'], 4)]
                );
            }
        }
    }

    private function computeNewCostPrice(array $item): float
    {
        $qty = (float) ($item['quantity'] ?? 1) ?: 1;
        $freeQty = (float) ($item['free_qty'] ?? 0);
        $totalQty = $qty + $freeQty ?: 1;
        $unitPrice = (float) ($item['unit_price'] ?? 0);
        $discountType = ($item['discount_type'] ?? null) === 'none' ? null : ($item['discount_type'] ?? null);
        $discountValue = (float) ($item['discount_value'] ?? 0);
        $base = $qty * $unitPrice;
        $discountAmount = $this->calculateDiscountAmount($base, $discountType, $discountValue);

        return round(($base - $discountAmount) / $totalQty, 4);
    }

    private function computeUnitCostPrice(array $item): float
    {
        $newCostPrice = $this->computeNewCostPrice($item);
        $packSize = (float) ($item['pack_size'] ?? 1) ?: 1;

        return round($newCostPrice / $packSize, 4);
    }

    private function computeUnitSalesPrice(?float $salePrice, array $item): ?float
    {
        if ($salePrice === null) {
            return null;
        }

        $packSize = (float) ($item['pack_size'] ?? 1) ?: 1;

        return round($salePrice / $packSize, 4);
    }

    private function computeUnitStock(array $item): float
    {
        $qty = (float) ($item['quantity'] ?? 0);
        $freeQty = (float) ($item['free_qty'] ?? 0);
        $packSize = (float) ($item['pack_size'] ?? 1) ?: 1;

        return round(($qty + $freeQty) * $packSize, 4);
    }

    private function calculateDiscountAmount(float $lineTotal, ?string $discountType, $discountValue): float
    {
        $discountValue = (float) $discountValue;

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
