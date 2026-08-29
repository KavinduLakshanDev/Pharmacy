<?php

namespace App\Http\Controllers;

use App\Enums\FinanceAccountStatus;
use App\Enums\FinanceAccountType;
use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use App\Models\Grn;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierReturn;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupplierPaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SupplierPayment::query()
            ->with(['supplier', 'bankAccount'])
            ->where('created_by', createdBy());

        if ($request->has('search') && $request->search !== null && trim($request->search) !== '') {
            $search = $request->search;
            $query->where(function ($subQuery) use ($search) {
                $subQuery->whereHas('supplier', function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_person_name', 'like', "%{$search}%");
                })
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $sortField = $request->get('sort_field', 'id');
        $sortDirection = $request->get('sort_direction', 'desc');
        $perPage = $request->get('per_page', 10);

        $payments = $query->orderBy($sortField, $sortDirection)->paginate($perPage);

        return Inertia::render('supplier-payments/index', [
            'payments' => $payments,
            'filters' => $request->only(['search', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function create(): Response
    {
        $bankAccounts = FinanceAccount::query()
            ->where('account_type', FinanceAccountType::Bank)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'bank_account_no', 'bank_branch']);

        return Inertia::render('supplier-payments/create', [
            'bankAccounts' => $bankAccounts,
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

    public function supplierDetails(Request $request)
    {
        $supplierId = $request->integer('supplier_id');

        $supplier = Supplier::find($supplierId);

        if (! $supplier) {
            return response()->json(['message' => 'Supplier not found'], 404);
        }

        $grnBalance = Grn::query()
            ->where('sup_id', $supplier->id)
            ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as balance')
            ->value('balance');

        $returnCredits = SupplierReturn::query()
            ->where('supplier_id', $supplier->id)
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total_returns')
            ->value('total_returns');

        $balance = (float) ($grnBalance ?? 0) - (float) ($returnCredits ?? 0);

        $recentPayments = SupplierPayment::query()
            ->where('supplier_id', $supplier->id)
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return response()->json([
            'supplier' => $supplier,
            'current_balance' => (float) $balance,
            'recent_payments' => $recentPayments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'payment_method' => ['required', 'string', Rule::in(['Cash', 'Cheque', 'Bank', 'Online Transfer'])],
            'paid_amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'selected_bank_id' => ['nullable', 'exists:finance_accounts,id'],
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

        $payment = SupplierPayment::create(array_merge(
            array_diff_key($validated, array_flip(['selected_bank_id'])),
            ['created_by' => auth()->id()]
        ));

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
            $supplier = Supplier::find($validated['supplier_id']);
            FinanceTransaction::create([
                'finance_account_id' => $financeAccountId,
                'amount' => round((float) $validated['paid_amount'], 2),
                'type' => 'debit',
                'transaction_date' => $validated['payment_date'],
                'reference' => 'SP-'.$payment->id,
                'description' => 'Supplier Payment - '.($supplier?->company_name ?? $validated['supplier_id']).' ('.$validated['payment_method'].')',
                'branch_id' => null,
                'created_by' => auth()->id(),
            ]);
        }

        return redirect()->route('inventory.supplier-payments.index')
            ->with('success', __('Supplier payment recorded successfully.'))
            ->with('payment_id', $payment->id);
    }

    public function receipt(SupplierPayment $supplierPayment)
    {
        return Inertia::render('supplier-payments/receipt', [
            'payment' => $supplierPayment->load(['supplier', 'bankAccount']),
        ]);
    }
}
