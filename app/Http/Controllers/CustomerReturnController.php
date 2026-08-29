<?php

namespace App\Http\Controllers;

use App\Enums\FinanceAccountStatus;
use App\Enums\FinanceAccountType;
use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\SaleStatus;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\CustomerReturn;
use App\Models\CustomerReturnItem;
use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\SalesTransaction;
use App\Models\SalesTransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $query = CustomerReturn::query()
            ->with([
                'customer:id,name,code,phone',
                'grn:id,invoice_no,grn_no,grn_date',
                'salesTransaction:id,sale_no,sale_date',
                'branch:id,name',
            ])
            ->where('created_by', createdBy());

        if ($request->has('search') && $request->search !== null && trim($request->search) !== '') {
            $search = $request->search;
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('return_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('salesTransaction', function ($q) use ($search) {
                        $q->where('sale_no', 'like', "%{$search}%");
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

        $customerReturns = $query->orderBy($sortField, $sortDirection)->paginate($perPage);

        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('inventory/customer-returns/index', [
            'customerReturns' => $customerReturns,
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

        return Inertia::render('inventory/customer-returns/create', [
            'branches' => $branches,
            'financeBankAccounts' => FinanceAccount::query()
                ->where('created_by', createdBy())
                ->where('account_type', FinanceAccountType::Bank)
                ->where('status', FinanceAccountStatus::Active)
                ->orderBy('name')
                ->get(['id', 'name', 'bank_branch', 'bank_account_no']),
        ]);
    }

    public function show(CustomerReturn $customerReturn): Response
    {
        if ($customerReturn->created_by !== createdBy()) {
            abort(403);
        }

        $customerReturn->load([
            'customer:id,name,code,phone',
            'grn:id,invoice_no,grn_no,grn_date',
            'salesTransaction:id,sale_no,sale_date',
            'branch:id,name',
            'items' => fn ($relation) => $relation->orderBy('id'),
            'items.product:id,name,sku',
        ]);

        return Inertia::render('inventory/customer-returns/show', [
            'customerReturn' => $customerReturn,
        ]);
    }

    public function searchCustomers(Request $request)
    {
        $search = trim($request->string('search')->toString());

        $customers = Customer::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($builder) use ($search): void {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get();

        return response()->json($customers->map(fn (Customer $customer): array => [
            'AdrKy' => $customer->id,
            'AdrCd' => $customer->code ?? '',
            'FstNm' => $customer->name,
            'LstNm' => '',
            'TP1' => $customer->phone ?? '',
            'Address' => $customer->address ?? '',
        ]));
    }

    public function sales(Request $request)
    {
        $query = SalesTransaction::query()
            ->where('created_by', createdBy())
            ->where('status', SaleStatus::Completed->value)
            ->orderByDesc('sale_date')
            ->orderByDesc('id')
            ->limit(100);

        if ($request->filled('branch_id')) {
            $query->where('branch_id', (int) $request->branch_id);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', (int) $request->customer_id);
        }

        $search = trim($request->string('search')->toString());
        if ($search !== '') {
            $query->where('sale_no', 'like', "%{$search}%");
        }

        $sales = $query->get(['id', 'sale_no', 'sale_date', 'total_amount', 'customer_id']);

        return response()->json($sales->map(fn (SalesTransaction $sale): array => [
            'id' => $sale->id,
            'sale_no' => $sale->sale_no,
            'sale_date' => $sale->sale_date?->toDateString(),
            'total_amount' => $sale->total_amount,
            'customer_id' => $sale->customer_id,
        ]));
    }

    public function searchProducts(Request $request)
    {
        $search = trim($request->string('search')->toString());
        $branchId = $request->filled('branch_id') ? (int) $request->branch_id : null;

        $ledgerOwnerId = createdBy();

        $productsWithPositiveStock = MasterTransaction::query()
            ->select('product_id')
            ->where('status', MasterTransactionStatus::Completed->value)
            ->where('created_by', $ledgerOwnerId)
            ->when($branchId !== null, function ($builder) use ($branchId): void {
                $builder->where('stock_type', MasterTransactionStockType::Branch->value)
                    ->where('stock_type_id', $branchId);
            })
            ->groupBy('product_id')
            ->havingRaw(
                'SUM(CASE WHEN transaction_type = ? THEN quantity WHEN transaction_type = ? THEN -quantity ELSE 0 END) > 0',
                [MasterTransactionType::In->value, MasterTransactionType::Out->value],
            );

        $query = Product::query()
            ->where(function ($builder): void {
                if (auth()->user()->type === 'company') {
                    $builder->where('created_by', createdBy());
                } else {
                    $builder->where('assigned_to', auth()->id());
                }
            })
            ->where('status', 'active')
            ->whereIn('id', $productsWithPositiveStock);

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('name')
            ->limit(25)
            ->get(['id', 'name', 'sku', 'price']);

        return response()->json($products->map(fn (Product $product): array => [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'unit_price' => (float) $product->price,
        ]));
    }

    /** Batch-level stock for an additional return line (same basis as POS sale batch picker). */
    public function additionalProductBatches(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ]);

        Branch::query()
            ->where('created_by', createdBy())
            ->whereKey($validated['branch_id'])
            ->firstOrFail();

        $product = Product::query()
            ->whereKey($validated['product_id'])
            ->where(function ($builder): void {
                if (auth()->user()->type === 'company') {
                    $builder->where('created_by', createdBy());
                } else {
                    $builder->where('assigned_to', auth()->id());
                }
            })
            ->where('status', 'active')
            ->firstOrFail();

        $ledgerOwnerId = createdBy();
        $branchId = (int) $validated['branch_id'];

        $batchBalances = MasterTransaction::query()
            ->where('product_id', $product->id)
            ->where('stock_type', MasterTransactionStockType::Branch->value)
            ->where('stock_type_id', $branchId)
            ->where('status', MasterTransactionStatus::Completed->value)
            ->where('created_by', $ledgerOwnerId)
            ->whereNotNull('batch_no')
            ->where('batch_no', '!=', '')
            ->groupBy('batch_no')
            ->selectRaw('batch_no, SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
            ->having('balance', '>', 0)
            ->get();

        $grnItemForPack = GrnItem::query()
            ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
            ->where('grn_items.product_id', $product->id)
            ->where('grns.branch_id', $branchId)
            ->latest('grn_items.id')
            ->select('grn_items.pack_size')
            ->first();

        $packSize = (float) ($grnItemForPack?->pack_size ?? $product->pack_size ?? 1);
        if ($packSize <= 0) {
            $packSize = 1;
        }

        $batches = $batchBalances->map(function ($batch) use ($product, $branchId, $packSize): array {
            $batchInfo = GrnItem::query()
                ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                ->where('grn_items.product_id', $product->id)
                ->where('grn_items.batch_no', $batch->batch_no)
                ->where('grns.branch_id', $branchId)
                ->latest('grn_items.id')
                ->select('grn_items.unit_sales_price', 'grn_items.expiry_date', 'grn_items.pack_size')
                ->first();

            $batchPackSize = (float) ($batchInfo?->pack_size ?? $packSize);
            if ($batchPackSize <= 0) {
                $batchPackSize = $packSize;
            }

            return [
                'batch_no' => $batch->batch_no,
                'balance' => round((float) $batch->balance * $batchPackSize, 2),
                'unit_sales_price' => $batchInfo?->unit_sales_price !== null ? (float) $batchInfo->unit_sales_price : null,
                'expiry_date' => $batchInfo?->expiry_date?->toDateString(),
            ];
        })->values()->all();

        $unitPrice = (float) $product->price;
        if ($batches !== []) {
            $lastBatch = $batches[array_key_last($batches)];
            if ($lastBatch['unit_sales_price'] !== null) {
                $unitPrice = $lastBatch['unit_sales_price'];
            }
        }

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'unit_price' => $unitPrice,
            'batches' => $batches,
        ]);
    }

    public function saleDetails(SalesTransaction $salesTransaction)
    {
        if ($salesTransaction->created_by !== createdBy()) {
            abort(403);
        }

        if ($salesTransaction->status !== SaleStatus::Completed) {
            abort(404);
        }

        $salesTransaction->load(['items.product']);

        return response()->json([
            'sale' => [
                'id' => $salesTransaction->id,
                'sale_no' => $salesTransaction->sale_no,
                'sale_date' => $salesTransaction->sale_date?->toDateString(),
                'total_amount' => $salesTransaction->total_amount,
                'branch_id' => $salesTransaction->branch_id,
            ],
            'items' => $salesTransaction->items->map(function (SalesTransactionItem $item) use ($salesTransaction) {
                $grnItem = GrnItem::query()
                    ->where('grn_items.product_id', $item->product_id)
                    ->where('grn_items.batch_no', $item->batch_no)
                    ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                    ->where('grns.branch_id', $salesTransaction->branch_id)
                    ->select('grn_items.*')
                    ->first();

                $packSize = $grnItem?->pack_size !== null && $grnItem->pack_size !== ''
                    ? (float) $grnItem->pack_size
                    : null;
                $soldUnits = (float) $item->quantity;
                $lineQtyBoxes = ($packSize !== null && $packSize > 0) ? ($soldUnits / $packSize) : $soldUnits;
                $maxUnits = $soldUnits;

                return [
                    'sale_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name ?? 'N/A',
                    'quantity' => $lineQtyBoxes,
                    'available_stock' => $lineQtyBoxes,
                    'available_units' => $maxUnits,
                    'pack_size' => $packSize,
                    'unit_cost_price' => (float) $item->unit_price,
                    'unit_stock' => $maxUnits,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                    'batch_no' => $item->batch_no,
                    'expiry_date' => $grnItem?->expiry_date?->toDateString(),
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $productsInput = collect($request->input('products', []))
            ->filter(fn (array $line): bool => (float) ($line['quantity'] ?? 0) > 0)
            ->values();

        if ($productsInput->isEmpty()) {
            throw ValidationException::withMessages([
                'products' => __('Add at least one product line with a return quantity.'),
            ]);
        }

        $request->merge(['products' => $productsInput->all()]);

        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'sales_transaction_id' => ['required', 'exists:sales_transactions,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'return_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'products' => ['required', 'array', 'min:1'],
            'products.*.sales_transaction_item_id' => ['nullable', 'integer', 'exists:sales_transaction_items,id'],
            'products.*.product_id' => ['required', 'exists:products,id'],
            'products.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'products.*.return_quantity' => ['nullable', 'numeric', 'min:0'],
            'products.*.unit_price' => ['required', 'numeric', 'min:0'],
            'products.*.batch_no' => ['nullable', 'string'],
            'products.*.expiry_date' => ['nullable', 'date'],
            'settlement_payment_mode' => [
                'nullable',
                'string',
                Rule::in(['cash', 'credit', 'card', 'cheque', 'bank', 'bank_transfer', 'split']),
            ],
            'settlement_cash_amount' => ['nullable', 'numeric', 'min:0'],
            'settlement_bank_amount' => ['nullable', 'numeric', 'min:0'],
            'settlement_online_amount' => ['nullable', 'numeric', 'min:0'],
            'settlement_cheque_amount' => ['nullable', 'numeric', 'min:0'],
            'settlement_finance_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')->where(function ($query): void {
                    $query->where('created_by', createdBy())
                        ->where('account_type', FinanceAccountType::Bank->value)
                        ->where('status', FinanceAccountStatus::Active->value);
                }),
            ],
            'settlement_cheque_no' => ['nullable', 'string', 'max:191'],
            'settlement_cheque_date' => ['nullable', 'date'],
            'settlement_cheque_bank_name' => ['nullable', 'string', 'max:191'],
            'settlement_cheque_branch' => ['nullable', 'string', 'max:191'],
        ]);

        $createdByUserId = createdBy();

        $sale = SalesTransaction::query()
            ->where('created_by', $createdByUserId)
            ->where('status', SaleStatus::Completed->value)
            ->with('items')
            ->findOrFail($validated['sales_transaction_id']);

        if ($sale->customer_id !== null && (int) $sale->customer_id !== (int) $validated['customer_id']) {
            throw ValidationException::withMessages([
                'customer_id' => __('This sale invoice belongs to a different customer.'),
            ]);
        }

        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;

        if ($branchId !== null && $sale->branch_id !== null && (int) $sale->branch_id !== $branchId) {
            throw ValidationException::withMessages([
                'branch_id' => __('The selected sale does not belong to this branch.'),
            ]);
        }

        $resolvedBranchId = $branchId ?? ($sale->branch_id !== null ? (int) $sale->branch_id : null);

        foreach ($validated['products'] as $product) {
            $saleItemId = isset($product['sales_transaction_item_id']) && $product['sales_transaction_item_id'] !== null && $product['sales_transaction_item_id'] !== ''
                ? (int) $product['sales_transaction_item_id']
                : null;

            if ($saleItemId !== null) {
                $saleItem = $sale->items->firstWhere('id', $saleItemId);

                if (! $saleItem || (int) $saleItem->product_id !== (int) $product['product_id']) {
                    throw ValidationException::withMessages([
                        'products' => __('Each line must belong to the selected sale invoice.'),
                    ]);
                }

                $quantity = (float) $product['quantity'];
                $maxBoxes = $this->maxReturnBoxesForSaleLine($saleItem, $sale);

                if ($quantity > $maxBoxes + 0.00001) {
                    throw ValidationException::withMessages([
                        'products' => __('Return quantity cannot exceed the quantity sold on this invoice line.'),
                    ]);
                }

                continue;
            }

            $this->ensureProductAccessibleForReturn((int) $product['product_id']);
        }

        $invoiceReturnCredit = 0.0;
        $exchangePurchaseAmount = 0.0;

        foreach ($validated['products'] as $product) {
            $quantity = (float) $product['quantity'];
            $unitPrice = (float) $product['unit_price'];
            $lineTotal = round($quantity * $unitPrice, 2);
            $saleItemIdForLine = isset($product['sales_transaction_item_id']) && $product['sales_transaction_item_id'] !== null && $product['sales_transaction_item_id'] !== ''
                ? (int) $product['sales_transaction_item_id']
                : null;

            if ($saleItemIdForLine !== null) {
                $invoiceReturnCredit += $lineTotal;
            } else {
                $exchangePurchaseAmount += $lineTotal;
            }
        }

        $invoiceReturnCredit = round($invoiceReturnCredit, 2);
        $exchangePurchaseAmount = round($exchangePurchaseAmount, 2);
        $customerAdditionalPaymentDue = round(max(0, $exchangePurchaseAmount - $invoiceReturnCredit), 2);
        $customerCreditAfterExchange = round(max(0, $invoiceReturnCredit - $exchangePurchaseAmount), 2);

        $requiresSettlement = $invoiceReturnCredit >= 0.005 || $exchangePurchaseAmount >= 0.005;
        $settlementCash = round((float) ($validated['settlement_cash_amount'] ?? 0), 2);
        $settlementBank = round((float) ($validated['settlement_bank_amount'] ?? 0), 2);
        $settlementOnline = round((float) ($validated['settlement_online_amount'] ?? 0), 2);
        $settlementCheque = round((float) ($validated['settlement_cheque_amount'] ?? 0), 2);
        $splitSum = round($settlementCash + $settlementBank + $settlementOnline + $settlementCheque, 2);
        $settlementPaymentMode = (string) ($validated['settlement_payment_mode'] ?? '');
        $settlementFinanceAccountId = isset($validated['settlement_finance_account_id']) && (int) $validated['settlement_finance_account_id'] > 0
            ? (int) $validated['settlement_finance_account_id']
            : null;

        if ($requiresSettlement) {
            if ($customerAdditionalPaymentDue >= 0.005) {
                if ($splitSum < 0.01) {
                    throw ValidationException::withMessages([
                        'settlement_cash_amount' => __('Enter settlement amounts that total :amount.', [
                            'amount' => number_format($customerAdditionalPaymentDue, 2),
                        ]),
                    ]);
                }

                $allowsPartialCredit = $settlementPaymentMode === 'credit';
                if ($allowsPartialCredit) {
                    if ($splitSum > $customerAdditionalPaymentDue + 0.02) {
                        throw ValidationException::withMessages([
                            'settlement_cash_amount' => __('Payment cannot exceed the amount due (:amount).', [
                                'amount' => number_format($customerAdditionalPaymentDue, 2),
                            ]),
                        ]);
                    }
                } elseif (abs($splitSum - $customerAdditionalPaymentDue) > 0.02) {
                    throw ValidationException::withMessages([
                        'settlement_cash_amount' => __('Settlement amounts must total :amount (currently :current).', [
                            'amount' => number_format($customerAdditionalPaymentDue, 2),
                            'current' => number_format($splitSum, 2),
                        ]),
                    ]);
                }

                if ($settlementCheque >= 0.005 && trim((string) ($validated['settlement_cheque_no'] ?? '')) === '') {
                    throw ValidationException::withMessages([
                        'settlement_cheque_no' => __('Enter cheque number when recording a cheque payment.'),
                    ]);
                }

                if (($settlementBank >= 0.005 || $settlementOnline >= 0.005) && $settlementFinanceAccountId === null) {
                    throw ValidationException::withMessages([
                        'settlement_finance_account_id' => __('Select a deposit bank account for bank or card settlement.'),
                    ]);
                }
            } elseif ($splitSum > 0.01) {
                throw ValidationException::withMessages([
                    'settlement_cash_amount' => __('This return has no net amount due from the customer. Use zero for all settlement amounts.'),
                ]);
            }
        }

        $approvedByUserId = auth()->id();

        DB::transaction(function () use (
            $approvedByUserId,
            $createdByUserId,
            $customerAdditionalPaymentDue,
            $customerCreditAfterExchange,
            $exchangePurchaseAmount,
            $invoiceReturnCredit,
            $resolvedBranchId,
            $sale,
            $settlementCash,
            $settlementBank,
            $settlementCheque,
            $settlementOnline,
            $splitSum,
            $validated,
        ): void {
            foreach ($validated['products'] as $product) {
                $saleItemIdForExchange = isset($product['sales_transaction_item_id']) && $product['sales_transaction_item_id'] !== null && $product['sales_transaction_item_id'] !== ''
                    ? (int) $product['sales_transaction_item_id']
                    : null;

                if ($saleItemIdForExchange !== null) {
                    continue;
                }

                $exchangeUnits = (float) $product['quantity'];
                if ($exchangeUnits < 0.01) {
                    continue;
                }

                if ($resolvedBranchId === null) {
                    throw ValidationException::withMessages([
                        'branch_id' => __('Select a branch so exchange stock can be recorded as a stock out.'),
                    ]);
                }

                $batchNo = isset($product['batch_no']) ? trim((string) $product['batch_no']) : '';
                if ($batchNo === '') {
                    throw ValidationException::withMessages([
                        'products' => __('Each exchange line must include a batch with available stock.'),
                    ]);
                }

                $grnItem = $this->lockGrnItemForBranchProductBatch(
                    $resolvedBranchId,
                    (int) $product['product_id'],
                    $batchNo,
                );

                if ($grnItem === null) {
                    throw ValidationException::withMessages([
                        'products' => __('Exchange product/batch was not found for this branch.'),
                    ]);
                }

                if ((float) $grnItem->unit_stock + 0.00001 < $exchangeUnits) {
                    $lineProduct = Product::query()->find((int) $product['product_id']);
                    throw ValidationException::withMessages([
                        'products' => __('Insufficient stock for exchange line (:product). Available: :qty units.', [
                            'product' => $lineProduct?->name ?? (string) $product['product_id'],
                            'qty' => number_format((float) $grnItem->unit_stock, 2),
                        ]),
                    ]);
                }

                $packSize = ($grnItem->pack_size !== null && $grnItem->pack_size !== '' && (float) $grnItem->pack_size > 0)
                    ? (float) $grnItem->pack_size
                    : 1.0;
                $stockingQuantityOut = $exchangeUnits / $packSize;
                $ledgerBoxes = $this->completedBranchStockBoxesForLedgerOwner(
                    $resolvedBranchId,
                    (int) $product['product_id'],
                    $createdByUserId,
                );

                if ($ledgerBoxes + 0.000001 < $stockingQuantityOut) {
                    $lineProduct = Product::query()->find((int) $product['product_id']);
                    throw ValidationException::withMessages([
                        'products' => __('Insufficient ledger stock for exchange line (:product). Available: :qty (stocking units).', [
                            'product' => $lineProduct?->name ?? (string) $product['product_id'],
                            'qty' => number_format($ledgerBoxes, 4),
                        ]),
                    ]);
                }
            }

            $returnNumber = $this->generateReturnNumber();
            $subTotal = 0;

            $customerReturn = CustomerReturn::create([
                'return_number' => $returnNumber,
                'customer_id' => $validated['customer_id'],
                'sales_transaction_id' => $sale->id,
                'grn_id' => null,
                'branch_id' => $resolvedBranchId,
                'return_date' => $validated['return_date'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'processed',
                'sub_total' => 0,
                'total_amount' => 0,
                'invoice_return_credit' => $invoiceReturnCredit,
                'exchange_purchase_amount' => $exchangePurchaseAmount,
                'customer_additional_payment_due' => $customerAdditionalPaymentDue,
                'customer_credit_after_exchange' => $customerCreditAfterExchange,
                'created_by' => $createdByUserId,
            ]);

            foreach ($validated['products'] as $index => $product) {
                $quantity = (float) $product['quantity'];
                $unitPrice = (float) $product['unit_price'];
                $totalPrice = $quantity * $unitPrice;
                $subTotal += $totalPrice;

                $saleItemId = isset($product['sales_transaction_item_id']) && $product['sales_transaction_item_id'] !== null && $product['sales_transaction_item_id'] !== ''
                    ? (int) $product['sales_transaction_item_id']
                    : null;

                CustomerReturnItem::create([
                    'customer_return_id' => $customerReturn->id,
                    'grn_item_id' => null,
                    'sales_transaction_item_id' => $saleItemId,
                    'product_id' => $product['product_id'],
                    'quantity' => $product['quantity'],
                    'unit_price' => $product['unit_price'],
                    'total_price' => $totalPrice,
                    'batch_no' => $product['batch_no'] ?? null,
                    'expiry_date' => $product['expiry_date'] ?? null,
                ]);

                $isInvoiceReturnLine = $saleItemId !== null;

                if ($isInvoiceReturnLine) {
                    MasterTransaction::query()->create([
                        'product_id' => $product['product_id'],
                        'transaction_type' => MasterTransactionType::In,
                        'transactionable_type' => MasterTransactionSourceType::CustomerReturn,
                        'transactionable_id' => $customerReturn->id,
                        'stock_type' => $resolvedBranchId ? MasterTransactionStockType::Branch : null,
                        'stock_type_id' => $resolvedBranchId,
                        'quantity' => $product['quantity'],
                        'unit_price' => $product['unit_price'],
                        'transaction_date' => $validated['return_date'],
                        'notes' => $validated['notes'] ?: "Customer return {$customerReturn->return_number} (stock in)",
                        'batch_no' => $product['batch_no'] ?? null,
                        'status' => MasterTransactionStatus::Completed,
                        'reference_number' => sprintf('%s-%02d', $customerReturn->return_number, $index + 1),
                        'created_by' => $createdByUserId,
                        'approved_by' => $approvedByUserId,
                        'approved_at' => now(),
                    ]);

                    $returnUnits = isset($product['return_quantity']) && $product['return_quantity'] !== '' && $product['return_quantity'] !== null
                        ? (float) $product['return_quantity']
                        : null;

                    if ($resolvedBranchId !== null && $returnUnits !== null && $returnUnits > 0) {
                        $this->restoreGrnUnitStockForReturnLine(
                            $resolvedBranchId,
                            (int) $product['product_id'],
                            isset($product['batch_no']) ? trim((string) $product['batch_no']) : '',
                            $returnUnits,
                        );
                    }

                    continue;
                }

                $exchangeUnits = (float) $product['quantity'];
                if ($exchangeUnits < 0.01 || $resolvedBranchId === null) {
                    continue;
                }

                $batchNo = isset($product['batch_no']) ? trim((string) $product['batch_no']) : '';
                $grnItem = $this->lockGrnItemForBranchProductBatch(
                    $resolvedBranchId,
                    (int) $product['product_id'],
                    $batchNo,
                );

                $packSize = ($grnItem?->pack_size !== null && $grnItem->pack_size !== '' && (float) $grnItem->pack_size > 0)
                    ? (float) $grnItem->pack_size
                    : 1.0;
                $stockingQuantity = $exchangeUnits / $packSize;

                MasterTransaction::query()->create([
                    'product_id' => $product['product_id'],
                    'transaction_type' => MasterTransactionType::Out,
                    'transactionable_type' => MasterTransactionSourceType::CustomerReturn,
                    'transactionable_id' => $customerReturn->id,
                    'stock_type' => MasterTransactionStockType::Branch,
                    'stock_type_id' => $resolvedBranchId,
                    'quantity' => $stockingQuantity,
                    'unit_price' => $product['unit_price'],
                    'transaction_date' => $validated['return_date'],
                    'notes' => $validated['notes'] ?: "Customer return {$customerReturn->return_number} (exchange / stock out)",
                    'batch_no' => $product['batch_no'] ?? null,
                    'status' => MasterTransactionStatus::Completed,
                    'reference_number' => sprintf('%s-%02d', $customerReturn->return_number, $index + 1),
                    'created_by' => $createdByUserId,
                    'approved_by' => $approvedByUserId,
                    'approved_at' => now(),
                ]);

                if ($grnItem !== null) {
                    $grnItem->decrement('unit_stock', $exchangeUnits);
                }
            }

            $customerReturn->update([
                'sub_total' => $subTotal,
                'total_amount' => $subTotal,
            ]);

            $this->recordInboundSettlementForCustomerReturn(
                $customerReturn,
                (int) $validated['customer_id'],
                $customerAdditionalPaymentDue,
                $splitSum,
                $settlementCash,
                $settlementBank,
                $settlementOnline,
                $settlementCheque,
                (string) $validated['return_date'],
                $validated,
                $approvedByUserId,
            );
        });

        return redirect()->route('inventory.customer-returns.index')
            ->with('success', __('Customer return recorded successfully.'));
    }

    private function completedBranchStockBoxesForLedgerOwner(
        int $branchId,
        int $productId,
        int $ledgerOwnerId,
    ): float {
        $inType = MasterTransactionType::In->value;
        $outType = MasterTransactionType::Out->value;

        $balance = MasterTransaction::query()
            ->where('product_id', $productId)
            ->where('stock_type', MasterTransactionStockType::Branch->value)
            ->where('stock_type_id', $branchId)
            ->where('status', MasterTransactionStatus::Completed->value)
            ->where('created_by', $ledgerOwnerId)
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN transaction_type = ? THEN CAST(quantity AS DECIMAL(18,6)) WHEN transaction_type = ? THEN -CAST(quantity AS DECIMAL(18,6)) ELSE 0 END), 0) as bal',
                [$inType, $outType],
            )
            ->value('bal');

        return (float) $balance;
    }

    /**
     * Lock the GRN batch row for branch stock checks and exchange deductions.
     */
    private function lockGrnItemForBranchProductBatch(
        int $branchId,
        int $productId,
        string $batchNo,
    ): ?GrnItem {
        if ($batchNo === '') {
            return null;
        }

        /** @var GrnItem|null $grnItem */
        $grnItem = GrnItem::query()
            ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
            ->where('grns.branch_id', $branchId)
            ->where('grn_items.product_id', $productId)
            ->where('grn_items.batch_no', $batchNo)
            ->select('grn_items.*')
            ->lockForUpdate()
            ->first();

        return $grnItem instanceof GrnItem ? $grnItem : null;
    }

    private function restoreGrnUnitStockForReturnLine(
        int $branchId,
        int $productId,
        string $batchNo,
        float $returnUnits,
    ): void {
        if ($batchNo === '') {
            return;
        }

        $grnItem = GrnItem::query()
            ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
            ->where('grns.branch_id', $branchId)
            ->where('grn_items.product_id', $productId)
            ->where('grn_items.batch_no', $batchNo)
            ->select('grn_items.*')
            ->first();

        if ($grnItem === null) {
            return;
        }

        $grnItem->increment('unit_stock', $returnUnits);
    }

    private function packSizeForSaleLine(SalesTransactionItem $item, SalesTransaction $sale): ?float
    {
        if ($sale->branch_id === null) {
            return null;
        }

        $grnItem = GrnItem::query()
            ->where('grn_items.product_id', $item->product_id)
            ->where('grn_items.batch_no', $item->batch_no)
            ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
            ->where('grns.branch_id', $sale->branch_id)
            ->select('grn_items.pack_size')
            ->first();

        if ($grnItem?->pack_size === null || $grnItem->pack_size === '') {
            return null;
        }

        $pack = (float) $grnItem->pack_size;

        return $pack > 0 ? $pack : null;
    }

    private function maxReturnBoxesForSaleLine(SalesTransactionItem $item, SalesTransaction $sale): float
    {
        $packSize = $this->packSizeForSaleLine($item, $sale);
        $soldUnits = (float) $item->quantity;

        if ($packSize !== null && $packSize > 0) {
            return $soldUnits / $packSize;
        }

        return $soldUnits;
    }

    private function generateReturnNumber(): string
    {
        $count = CustomerReturn::count() + 1;

        return sprintf('CRN-%s-%06d', now()->format('Ymd'), $count);
    }

    private function ensureProductAccessibleForReturn(int $productId): void
    {
        $exists = Product::query()
            ->where('id', $productId)
            ->where(function ($builder): void {
                if (auth()->user()->type === 'company') {
                    $builder->where('created_by', createdBy());
                } else {
                    $builder->where('assigned_to', auth()->id());
                }
            })
            ->where('status', 'active')
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'products' => __('One or more products are not valid for this return.'),
            ]);
        }
    }

    private function recordInboundSettlementForCustomerReturn(
        CustomerReturn $customerReturn,
        int $customerId,
        float $customerAdditionalPaymentDue,
        float $splitSum,
        float $settlementCash,
        float $settlementBank,
        float $settlementOnline,
        float $settlementCheque,
        string $returnDate,
        array $validated,
        int $createdByUserId,
    ): void {
        if ($customerAdditionalPaymentDue < 0.005 || $splitSum < 0.01) {
            return;
        }

        $customer = Customer::query()->lockForUpdate()->findOrFail($customerId);
        $baseNote = __('Return :no', ['no' => $customerReturn->return_number]);
        $financeAccountId = isset($validated['settlement_finance_account_id']) && (int) $validated['settlement_finance_account_id'] > 0
            ? (int) $validated['settlement_finance_account_id']
            : null;

        $chunks = [];
        if ($settlementCash >= 0.005) {
            $chunks[] = [
                'method' => 'Cash',
                'amount' => $settlementCash,
                'payload' => [],
            ];
        }
        if ($settlementBank >= 0.005) {
            $chunks[] = [
                'method' => 'Bank',
                'amount' => $settlementBank,
                'payload' => [
                    'bank_account_id' => $financeAccountId,
                ],
            ];
        }
        if ($settlementOnline >= 0.005) {
            $chunks[] = [
                'method' => 'Online Transfer',
                'amount' => $settlementOnline,
                'payload' => [
                    'bank_account_id' => $financeAccountId,
                ],
            ];
        }
        if ($settlementCheque >= 0.005) {
            $chunks[] = [
                'method' => 'Cheque',
                'amount' => $settlementCheque,
                'payload' => [
                    'cheque_no' => isset($validated['settlement_cheque_no']) ? trim((string) $validated['settlement_cheque_no']) : null,
                    'cheque_bank_name' => $validated['settlement_cheque_bank_name'] ?? null,
                    'cheque_branch' => $validated['settlement_cheque_branch'] ?? null,
                    'cheque_date' => $validated['settlement_cheque_date'] ?? null,
                ],
            ];
        }

        foreach ($chunks as $chunk) {
            $payment = CustomerPayment::query()->create(array_merge(
                [
                    'customer_id' => $customer->id,
                    'customer_return_id' => $customerReturn->id,
                    'payment_method' => $chunk['method'],
                    'paid_amount' => $chunk['amount'],
                    'payment_date' => $returnDate,
                    'notes' => $baseNote.' — '.$chunk['method'],
                    'created_by' => $createdByUserId,
                ],
                $chunk['payload'],
            ));

            $this->allocateCustomerInboundPaymentToLedger($customer, (float) $chunk['amount']);
            $this->recordFinanceTransactionForReturnCustomerPayment(
                $customer,
                $payment,
                (string) $chunk['method'],
                (float) $chunk['amount'],
                $returnDate,
                $financeAccountId,
                $createdByUserId,
            );
        }

        $shortfall = round(max(0, $customerAdditionalPaymentDue - $splitSum), 2);
        if ($shortfall >= 0.01) {
            $customer->refresh();
            $customer->update([
                'current_balance' => round((float) ($customer->current_balance ?? 0) + $shortfall, 2),
            ]);
        }
    }

    private function allocateCustomerInboundPaymentToLedger(Customer $customer, float $amount): void
    {
        $remaining = round($amount, 2);
        if ($remaining < 0.0001) {
            return;
        }

        $customer->refresh();

        $sales = SalesTransaction::query()
            ->where('customer_id', $customer->id)
            ->whereIn('status', [SaleStatus::Completed->value, SaleStatus::Partial->value])
            ->where('balance_amount', '>', 0)
            ->orderBy('sale_date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($sales as $sale) {
            if ($remaining < 0.0001) {
                break;
            }

            $due = round((float) $sale->balance_amount, 2);
            $apply = round(min($remaining, $due), 2);
            $newPaid = round((float) $sale->paid_amount + $apply, 2);
            $newBalance = round(max(0, (float) $sale->total_amount - $newPaid), 2);

            $sale->update([
                'paid_amount' => $newPaid,
                'balance_amount' => $newBalance,
            ]);

            $remaining -= $apply;
        }

        if ($remaining > 0.0001) {
            $customer->refresh();
            $customer->update([
                'current_balance' => max(0, round((float) ($customer->current_balance ?? 0) - $remaining, 2)),
            ]);
        }
    }

    private function recordFinanceTransactionForReturnCustomerPayment(
        Customer $customer,
        CustomerPayment $payment,
        string $method,
        float $amount,
        string $returnDate,
        ?int $selectedFinanceAccountId,
        int $createdByUserId,
    ): void {
        $financeAccountId = $selectedFinanceAccountId;

        if (! $financeAccountId && $method === 'Cash') {
            $cashAccount = FinanceAccount::query()
                ->where('account_type', FinanceAccountType::Cash)
                ->where('status', FinanceAccountStatus::Active)
                ->orderBy('id')
                ->first();
            $financeAccountId = $cashAccount?->id;
        }

        if (! $financeAccountId) {
            return;
        }

        FinanceTransaction::query()->create([
            'finance_account_id' => $financeAccountId,
            'amount' => round($amount, 2),
            'type' => 'credit',
            'transaction_date' => $returnDate,
            'reference' => 'CP-'.$payment->id,
            'description' => __('Customer return settlement - :name (:method)', [
                'name' => $customer->name,
                'method' => $method,
            ]),
            'branch_id' => $customer->branch_id ?? null,
            'created_by' => $createdByUserId,
        ]);
    }
}
