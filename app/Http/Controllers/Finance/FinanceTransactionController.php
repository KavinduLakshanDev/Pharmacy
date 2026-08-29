<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceTransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = FinanceTransaction::query()->with(['account', 'creator', 'branch']);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search): void {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('account_id') && $request->string('account_id')->toString() !== 'all') {
            $query->where('finance_account_id', $request->string('account_id')->toString());
        }

        if ($request->filled('type') && $request->string('type')->toString() !== 'all') {
            $query->where('type', $request->string('type')->toString());
        }

        if ($request->filled('branch_id') && $request->string('branch_id')->toString() !== 'all') {
            $query->where('branch_id', $request->string('branch_id')->toString());
        }

        if ($request->filled('date_from')) {
            $query->where('transaction_date', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->where('transaction_date', '<=', $request->string('date_to')->toString().' 23:59:59');
        }

        $transactions = $query
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return Inertia::render('finance/transactions/index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'account_id', 'type', 'branch_id', 'date_from', 'date_to', 'per_page']),
            'accounts' => FinanceAccount::query()->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'finance_account_id' => ['required', 'exists:finance_accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'type' => ['required', Rule::in(['credit', 'debit'])],
            'transaction_date' => ['required', 'date'],
            'reference' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        FinanceTransaction::create(array_merge($validated, ['created_by' => auth()->id()]));

        return redirect()->route('finance.transactions.index')
            ->with('success', __('Transaction recorded successfully.'));
    }
}
