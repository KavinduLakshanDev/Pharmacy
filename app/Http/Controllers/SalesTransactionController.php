<?php

namespace App\Http\Controllers;

use App\Enums\DiscountType;
use App\Enums\FinanceAccountType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\SaleStatus;
use App\Http\Requests\SalesTransactionRequest;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Customer;
use App\Models\FinanceAccount;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\PosSession;
use App\Models\Product;
use App\Models\SalesTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesTransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SalesTransaction::with(['customer', 'branch']);

        if ($request->filled('search')) {
            $query->where('sale_no', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $sales = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 10));

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'customers' => Customer::select('id', 'name')->get(),
            'statuses' => SaleStatus::values(),
            'filters' => $request->all(['search', 'status', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $activeSession = PosSession::where('user_id', auth()->id())
            ->where('status', 'active')
            ->first();

        if (! $activeSession) {
            return Inertia::render('sales/create', [
                'mustStartSession' => true,
                'cashRegisters' => CashRegister::where('created_by', createdBy())->get(),
                'branches' => Branch::where('created_by', createdBy())->select('id', 'name')->get(),
            ]);
        }

        $branchId = $activeSession->branch_id;

        $products = $this->getProductsWithStock($branchId);

        return Inertia::render('sales/create', [
            'activeSession' => $activeSession,
            'customers' => Customer::select('id', 'name', 'type', 'points', 'privileged_customer_number', 'phone')->get(),
            'branches' => Branch::where('created_by', createdBy())->select('id', 'name')->get(),
            'currentBranchId' => $branchId,
            'products' => $products,
            'statuses' => SaleStatus::values(),
            'discountTypes' => DiscountType::values(),
            'pointsRule' => \App\Models\PointsEarningRule::forCompany(createdBy()),
            'financeAccounts' => FinanceAccount::whereIn('account_type', [FinanceAccountType::Bank, FinanceAccountType::Card])
                ->where(function ($query) use ($branchId) {
                    $query->whereNull('branch_id')->orWhere('branch_id', $branchId);
                })
                ->where('status', \App\Enums\FinanceAccountStatus::Active)
                ->get(['id', 'name', 'account_type']),
            'nextSaleNo' => $this->generateSaleNo(now()->toDateString()),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SalesTransactionRequest $request)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $activeSession = PosSession::where('user_id', auth()->id())
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (! $activeSession) {
                return redirect()->back()->with('error', __('Active POS session required.'));
            }

            $data = $request->validated();
            $items = $data['items'] ?? [];
            unset($data['items']);

            // 1. Stock Validation with Locking
            foreach ($items as $item) {
                $grnItem = GrnItem::query()
                    ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                    ->where('grn_items.product_id', $item['product_id'])
                    ->where('grn_items.batch_no', $item['batch_no'] ?? null)
                    ->where('grns.branch_id', $activeSession->branch_id)
                    ->select('grn_items.*')
                    ->lockForUpdate()
                    ->first();

                if (! $grnItem) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => [__('Product/Batch not found in this branch.')],
                    ]);
                }

                if ($grnItem->unit_stock < $item['quantity']) {
                    $product = Product::find($item['product_id']);
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => [__('Insufficient stock for :product. Available: :qty', [
                            'product' => $product->name,
                            'qty' => number_format($grnItem->unit_stock, 2),
                        ])],
                    ]);
                }
            }

            if (empty($data['customer_id'])) {
                $walkInCustomer = Customer::where('name', 'like', '%Walk-in%')->first();

                if (! $walkInCustomer) {
                    $walkInCustomer = Customer::create([
                        'name' => 'Walk-in Customer',
                        'code' => 'CUST000',
                        'email' => 'walkin@unitec.test',
                        'phone' => '0000000000',
                        'type' => 'customer',
                        'address' => 'N/A',
                    ]);
                }

                $data['customer_id'] = $walkInCustomer->id;
            }

            // 1b. Points Redemption Validation
            $pointsRedeemed = (float) ($data['points_redeemed'] ?? 0);
            if ($pointsRedeemed > 0) {
                $customer = Customer::lockForUpdate()->find($data['customer_id']);
                if (! $customer || $customer->type !== 'privileged_customer') {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'points_redeemed' => [__('Only privileged customers can redeem points.')],
                    ]);
                }
                if ($customer->points < $pointsRedeemed) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'points_redeemed' => [__('Insufficient points. Available: :available', ['available' => $customer->points])],
                    ]);
                }
                // Auto calculate redemption amount from rules
                $companyId = createdBy();
                $data['points_redeemed_amount'] = \App\Models\PointsEarningRule::pointsToCash($pointsRedeemed, $companyId);
            }

            // 2. Safe Sale No Generation (inside transaction)
            $data['sale_no'] = $this->generateSaleNo($data['sale_date'] ?? '');
            $data['created_by'] = auth()->id();
            $data['pos_session_id'] = $activeSession->id;
            $data['branch_id'] = $activeSession->branch_id;

            $sale = SalesTransaction::create($data);

            if (! empty($items)) {
                foreach ($items as $item) {
                    $sale->items()->create($this->prepareItemData($item));
                }
            }

            $payments = $request->validated()['payments'] ?? [];
            if (! empty($payments)) {
                foreach ($payments as $payment) {
                    $sale->payments()->create($payment);
                }
            }

            $sale->refresh();
            $sale->calculateTotals();

            return redirect()->back()->with([
                'success' => __('Sale created successfully.'),
                'last_sale' => $sale->load(['customer', 'items.product', 'payments']),
            ]);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(SalesTransaction $salesTransaction)
    {
        $salesTransaction->load(['customer', 'branch', 'items.product.unit']);

        return Inertia::render('sales/show', [
            'sale' => $salesTransaction,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, SalesTransaction $salesTransaction)
    {
        if ($salesTransaction->status === SaleStatus::Completed && ! $request->user()->can('edit-completed-sales')) {
            return redirect()->route('sales.index')->with('error', __('Completed sales cannot be edited.'));
        }

        $salesTransaction->load(['customer', 'branch', 'items.product.unit']);

        return Inertia::render('sales/edit', [
            'sale' => $salesTransaction,
            'customers' => Customer::select('id', 'name', 'type', 'points', 'privileged_customer_number', 'phone')->get(),
            'branches' => Branch::where('created_by', createdBy())->select('id', 'name')->get(),
            'products' => $this->getProductsWithStock($salesTransaction->branch_id),
            'statuses' => SaleStatus::values(),
            'discountTypes' => DiscountType::values(),
            'financeAccounts' => FinanceAccount::whereIn('account_type', [FinanceAccountType::Bank, FinanceAccountType::Card])
                ->where(function ($query) use ($salesTransaction) {
                    $query->whereNull('branch_id')->orWhere('branch_id', $salesTransaction->branch_id);
                })
                ->where('status', \App\Enums\FinanceAccountStatus::Active)
                ->get(['id', 'name', 'account_type']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SalesTransactionRequest $request, SalesTransaction $salesTransaction)
    {
        if ($salesTransaction->status === SaleStatus::Completed && ! auth()->user()->can('edit-completed-sales')) {
            return redirect()->route('sales.index')->with('error', __('Completed sales cannot be updated.'));
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $salesTransaction) {
            $data = $request->validated();
            $items = $data['items'] ?? [];
            unset($data['items']);

            // 1. Stock Validation with Locking (accounting for existing items in the same sale)
            foreach ($items as $item) {
                $grnItem = GrnItem::query()
                    ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                    ->where('grn_items.product_id', $item['product_id'])
                    ->where('grn_items.batch_no', $item['batch_no'] ?? null)
                    ->where('grns.branch_id', $salesTransaction->branch_id)
                    ->select('grn_items.*')
                    ->lockForUpdate()
                    ->first();

                if (! $grnItem) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => [__('Product/Batch not found in this branch.')],
                    ]);
                }

                // Find if this item was already part of this sale to calculate "real" available stock
                $existingItem = $salesTransaction->items()
                    ->where('product_id', $item['product_id'])
                    ->where('batch_no', $item['batch_no'] ?? null)
                    ->first();

                $oldQty = $existingItem ? (float) $existingItem->quantity : 0;
                $effectiveAvailable = (float) $grnItem->unit_stock + $oldQty;

                if ($effectiveAvailable < $item['quantity']) {
                    $product = Product::find($item['product_id']);
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => [__('Insufficient stock for :product. Available: :qty', [
                            'product' => $product->name,
                            'qty' => number_format($effectiveAvailable, 2),
                        ])],
                    ]);
                }
            }

            $salesTransaction->update($data);

            // Clear and re-create items
            $salesTransaction->items()->delete();

            if (! empty($items)) {
                foreach ($items as $item) {
                    $salesTransaction->items()->create($this->prepareItemData($item));
                }
            }

            // Clear and re-create payments
            $salesTransaction->payments()->delete();
            $payments = $request->validated()['payments'] ?? [];
            if (! empty($payments)) {
                foreach ($payments as $payment) {
                    $salesTransaction->payments()->create($payment);
                }
            }

            $salesTransaction->refresh();
            $salesTransaction->calculateTotals();

            return redirect()->route('sales.index')->with('success', __('Sale updated successfully.'));
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SalesTransaction $salesTransaction)
    {
        if ($salesTransaction->status === SaleStatus::Completed && ! auth()->user()->can('edit-completed-sales')) {
            return redirect()->route('sales.index')->with('error', __('Completed sales cannot be deleted.'));
        }

        $salesTransaction->delete();

        return redirect()->route('sales.index')->with('success', __('Sale deleted successfully.'));
    }

    public function nextNumber(Request $request): \Illuminate\Http\JsonResponse
    {
        $date = $request->get('date', now()->toDateString());

        return response()->json([
            'sale_no' => $this->generateSaleNo($date),
        ]);
    }

    public function searchByNumber(Request $request): \Illuminate\Http\JsonResponse
    {
        $saleNo = $request->get('sale_no');
        $sale = SalesTransaction::with(['customer', 'items.product', 'payments'])
            ->where('sale_no', $saleNo)
            ->first();

        if (! $sale) {
            return response()->json(['message' => __('Sale not found.')], 404);
        }

        return response()->json($sale);
    }

    private function generateSaleNo(string $date = ''): string
    {
        if (! $date) {
            $date = now()->toDateString();
        }

        $dateStr = date('ymd', strtotime($date));
        $count = SalesTransaction::withTrashed()->where('sale_date', $date)->count() + 1;

        return 'S-'.$dateStr.'-'.str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    private function prepareItemData(array $item): array
    {
        $discountType = ($item['discount_type'] ?? null) === 'none' ? null : ($item['discount_type'] ?? null);
        $totalPrice = (float) ($item['quantity'] ?? 0) * (float) ($item['unit_price'] ?? 0);
        $discountAmount = $this->calculateDiscountAmount($totalPrice, $discountType, $item['discount_value'] ?? 0);

        return array_merge($item, [
            'discount_type' => $discountType,
            'total_price' => $totalPrice,
            'discount_amount' => $discountAmount,
        ]);
    }

    private function getProductsWithStock($branchId)
    {
        return Product::query()
            ->with(['unit', 'detailsPrices', 'genericName'])
            ->get()
            ->map(function ($product) use ($branchId) {
                // Get branch stock in stocking units (boxes) from MasterTransaction
                $stockingBalance = MasterTransaction::query()
                    ->where('product_id', $product->id)
                    ->where('stock_type', MasterTransactionStockType::Branch->value)
                    ->where('stock_type_id', $branchId)
                    ->where('status', MasterTransactionStatus::Completed->value)
                    ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
                    ->value('balance') ?? 0;

                // Get latest pack size for this product/branch to convert to sales units (tablets)
                $grnItem = GrnItem::query()
                    ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                    ->where('grn_items.product_id', $product->id)
                    ->where('grns.branch_id', $branchId)
                    ->latest('grn_items.id')
                    ->first();

                $packSize = (float) ($grnItem->pack_size ?? $product->pack_size ?? 1);
                $product->branch_stock = round($stockingBalance * $packSize, 2);

                // Fetch available batches for this product in this branch
                $batchBalances = MasterTransaction::query()
                    ->where('product_id', $product->id)
                    ->where('stock_type', MasterTransactionStockType::Branch->value)
                    ->where('stock_type_id', $branchId)
                    ->where('status', MasterTransactionStatus::Completed->value)
                    ->whereNotNull('batch_no')
                    ->groupBy('batch_no')
                    ->selectRaw('batch_no, SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
                    ->having('balance', '>', 0)
                    ->get();

                $product->batches = $batchBalances->map(function ($batch) use ($product, $branchId, $packSize) {
                    $batchInfo = GrnItem::query()
                        ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                        ->where('grn_items.product_id', $product->id)
                        ->where('grn_items.batch_no', $batch->batch_no)
                        ->where('grns.branch_id', $branchId)
                        ->latest('grn_items.id')
                        ->select('grn_items.unit_sales_price', 'grn_items.expiry_date', 'grn_items.pack_size')
                        ->first();

                    $batchPackSize = (float) ($batchInfo->pack_size ?? $packSize);

                    return (object) [
                        'batch_no' => $batch->batch_no,
                        'balance' => round($batch->balance * $batchPackSize, 2),
                        'unit_sales_price' => $batchInfo?->unit_sales_price,
                        'expiry_date' => $batchInfo?->expiry_date,
                    ];
                });

                if ($product->batches->count() > 0) {
                    $product->price = $product->batches->last()->unit_sales_price;
                }

                return $product;
            });
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
