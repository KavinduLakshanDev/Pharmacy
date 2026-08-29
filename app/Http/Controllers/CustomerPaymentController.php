<?php

namespace App\Http\Controllers;

use App\Enums\FinanceAccountStatus;
use App\Enums\FinanceAccountType;
use App\Enums\SaleStatus;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use App\Models\SalesTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPaymentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('customer-payments/index', [
            'bankAccounts' => FinanceAccount::query()
                ->where('account_type', FinanceAccountType::Bank)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'bank_account_no', 'bank_branch']),
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

        $ids = $customers->pluck('id');

        $outstandingByCustomerId = $ids->isEmpty()
            ? collect()
            : SalesTransaction::query()
                ->whereIn('customer_id', $ids->all())
                ->whereIn('status', [SaleStatus::Completed, SaleStatus::Partial])
                ->selectRaw('customer_id, COALESCE(SUM(balance_amount), 0) as outstanding')
                ->groupBy('customer_id')
                ->pluck('outstanding', 'customer_id');

        return response()->json($customers->map(fn (Customer $customer): array => [
            'AdrKy' => $customer->id,
            'AdrCd' => $customer->code,
            'FstNm' => $customer->name,
            'LstNm' => '',
            'TP1' => $customer->phone,
            'Address' => $customer->address,
            'current_balance' => (float) ($outstandingByCustomerId[$customer->id] ?? 0),
        ]));
    }

    public function customerDetails(Request $request)
    {
        $customer = Customer::query()->find($request->integer('customer_id'));

        if (! $customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        $outstanding = (float) SalesTransaction::query()
            ->where('customer_id', $customer->id)
            ->whereIn('status', [SaleStatus::Completed, SaleStatus::Partial])
            ->sum('balance_amount');

        return response()->json([
            'customer' => $customer,
            'current_balance' => $outstanding,
            'recent_payments' => CustomerPayment::query()
                ->where('customer_id', $customer->id)
                ->orderByDesc('id')
                ->limit(5)
                ->get(),
            'outstanding_invoices' => SalesTransaction::query()
                ->where('customer_id', $customer->id)
                ->whereIn('status', [SaleStatus::Completed, SaleStatus::Partial])
                ->where('balance_amount', '>', 0)
                ->orderByDesc('sale_date')
                ->get(['id', 'sale_no', 'sale_date', 'total_amount', 'paid_amount', 'balance_amount']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'payment_method' => ['required', 'string', Rule::in(['Cash', 'Cheque', 'Bank', 'Online Transfer'])],
            'paid_amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'selected_bank_id' => ['nullable', 'exists:finance_accounts,id'],
            'invoice_payments' => ['nullable', 'string'],
            'cheque_no' => ['nullable', 'string'],
            'cheque_bank_name' => ['nullable', 'string'],
            'cheque_branch' => ['nullable', 'string'],
            'cheque_date' => ['nullable', 'date'],
            'cheque_account_no' => ['nullable', 'string'],
            'bank_name' => ['nullable', 'string'],
            'bank_reference_no' => ['nullable', 'string'],
            'bank_branch' => ['nullable', 'string'],
            'bank_deposit_date' => ['nullable', 'date'],
            'bank_account_no' => ['nullable', 'string'],
            'transfer_reference_no' => ['nullable', 'string'],
            'transfer_transaction_id' => ['nullable', 'string'],
            'transfer_bank_name' => ['nullable', 'string'],
            'transfer_branch' => ['nullable', 'string'],
            'transfer_date' => ['nullable', 'date'],
        ]);

        // Parse invoice-specific payment allocations if provided
        $invoiceAllocations = [];
        if (! empty($validated['invoice_payments'])) {
            $decoded = json_decode($validated['invoice_payments'], true);
            if (is_array($decoded)) {
                foreach ($decoded as $item) {
                    $saleId = (int) ($item['sale_id'] ?? 0);
                    $amount = round((float) ($item['amount'] ?? 0), 2);
                    if ($saleId > 0 && $amount > 0) {
                        $invoiceAllocations[$saleId] = $amount;
                    }
                }
            }
        }

        $payment = DB::transaction(function () use ($validated, $invoiceAllocations): CustomerPayment {
            $customer = Customer::query()->lockForUpdate()->findOrFail($validated['customer_id']);
            $payment = CustomerPayment::query()->create([
                ...Arr::except($validated, ['selected_bank_id', 'invoice_payments']),
                'created_by' => auth()->id(),
            ]);

            $remaining = round((float) $validated['paid_amount'], 2);

            if (! empty($invoiceAllocations)) {
                // Apply payments to specific invoices as allocated
                $sales = SalesTransaction::query()
                    ->whereIn('id', array_keys($invoiceAllocations))
                    ->where('customer_id', $customer->id)
                    ->whereIn('status', [SaleStatus::Completed, SaleStatus::Partial])
                    ->where('balance_amount', '>', 0)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                foreach ($invoiceAllocations as $saleId => $allocAmount) {
                    $sale = $sales[$saleId] ?? null;
                    if (! $sale) {
                        continue;
                    }

                    $due = round((float) $sale->balance_amount, 2);
                    $apply = round(min($allocAmount, $due, $remaining), 2);
                    if ($apply < 0.0001) {
                        continue;
                    }

                    $sale->update([
                        'paid_amount' => round((float) $sale->paid_amount + $apply, 2),
                        'balance_amount' => round(max(0, (float) $sale->total_amount - ((float) $sale->paid_amount + $apply)), 2),
                    ]);

                    $remaining -= $apply;
                }
            } else {
                // Distribute oldest-first when no specific allocation provided
                $sales = SalesTransaction::query()
                    ->where('customer_id', $customer->id)
                    ->whereIn('status', [SaleStatus::Completed, SaleStatus::Partial])
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
            }

            if ($remaining > 0.0001) {
                $customer->update([
                    'current_balance' => max(0, round((float) ($customer->current_balance ?? 0) - $remaining, 2)),
                ]);
            }

            // Record a Finance Transaction so the payment appears in Finance Management
            $financeAccountId = $validated['selected_bank_id'] ?? null;

            if (! $financeAccountId && $validated['payment_method'] === 'Cash') {
                $cashAccount = FinanceAccount::query()
                    ->where('account_type', FinanceAccountType::Cash)
                    ->where('status', FinanceAccountStatus::Active)
                    ->orderBy('id')
                    ->first();
                $financeAccountId = $cashAccount?->id;
            }

            if ($financeAccountId) {
                FinanceTransaction::create([
                    'finance_account_id' => $financeAccountId,
                    'amount' => round((float) $validated['paid_amount'], 2),
                    'type' => 'credit',
                    'transaction_date' => $validated['payment_date'],
                    'reference' => 'CP-'.$payment->id,
                    'description' => 'Customer Payment - '.$customer->name.' ('.$validated['payment_method'].')',
                    'branch_id' => $customer->branch_id ?? null,
                    'created_by' => auth()->id(),
                ]);
            }

            return $payment;
        });

        return redirect()->route('inventory.customer-payments.index')
            ->with('success', __('Customer payment recorded successfully.'))
            ->with('payment_id', $payment->id);
    }
}
