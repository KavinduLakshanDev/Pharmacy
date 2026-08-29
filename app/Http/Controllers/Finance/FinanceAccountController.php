<?php

namespace App\Http\Controllers\Finance;

use App\Enums\FinanceAccountStatus;
use App\Enums\FinanceAccountType;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\FinanceAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $query = FinanceAccount::query()->with(['branch', 'creator']);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('account_type') && $request->string('account_type')->toString() !== 'all') {
            $query->where('account_type', $request->string('account_type')->toString());
        }

        if ($request->filled('status') && $request->string('status')->toString() !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('branch_id') && $request->string('branch_id')->toString() !== 'all') {
            $query->where('branch_id', $request->string('branch_id')->toString());
        }

        $accounts = $query
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        $accountsWithBalance = $accounts->through(fn (FinanceAccount $account): array => [
            'id' => $account->id,
            'name' => $account->name,
            'account_type' => $account->account_type->value,
            'status' => $account->status->value,
            'description' => $account->description,
            'bank_branch' => $account->bank_branch,
            'bank_account_no' => $account->bank_account_no,
            'branch' => $account->branch,
            'creator' => $account->creator,
            'balance' => $account->balance(),
            'created_at' => $account->created_at,
        ]);

        return Inertia::render('finance/accounts/index', [
            'accounts' => $accountsWithBalance,
            'filters' => $request->only(['search', 'account_type', 'status', 'branch_id', 'per_page']),
            'accountTypes' => FinanceAccountType::options(),
            'statusOptions' => FinanceAccountStatus::options(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('finance/accounts/create', [
            'accountTypes' => FinanceAccountType::options(),
            'statusOptions' => FinanceAccountStatus::options(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'account_type' => ['required', Rule::in(FinanceAccountType::values())],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'status' => ['required', Rule::in(FinanceAccountStatus::values())],
            'description' => ['nullable', 'string', 'max:1000'],
            'bank_branch' => ['required_if:account_type,bank', 'nullable', 'string'],
            'bank_account_no' => ['required_if:account_type,bank', 'nullable', 'string'],
        ]);

        FinanceAccount::create(array_merge($validated, ['created_by' => auth()->id()]));

        return redirect()->route('finance.accounts.index')
            ->with('success', __('Finance account created successfully.'));
    }

    public function show(FinanceAccount $account, Request $request): Response
    {
        $query = $account->transactions()->with(['creator', 'branch']);

        if ($request->filled('date_from')) {
            $query->where('transaction_date', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->where('transaction_date', '<=', $request->string('date_to')->toString().' 23:59:59');
        }

        $transactions = $query->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return Inertia::render('finance/accounts/show', [
            'account' => array_merge($account->toArray(), ['balance' => $account->balance()]),
            'transactions' => $transactions,
            'dateFilter' => $request->only(['date_from', 'date_to']),
        ]);
    }

    public function edit(FinanceAccount $account): Response
    {
        return Inertia::render('finance/accounts/edit', [
            'account' => $account,
            'accountTypes' => FinanceAccountType::options(),
            'statusOptions' => FinanceAccountStatus::options(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, FinanceAccount $account): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'account_type' => ['required', Rule::in(FinanceAccountType::values())],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'status' => ['required', Rule::in(FinanceAccountStatus::values())],
            'description' => ['nullable', 'string', 'max:1000'],
            'bank_branch' => ['required_if:account_type,bank', 'nullable', 'string'],
            'bank_account_no' => ['required_if:account_type,bank', 'nullable', 'string'],
        ]);

        $account->update($validated);

        return redirect()->route('finance.accounts.index')
            ->with('success', __('Finance account updated successfully.'));
    }
}
