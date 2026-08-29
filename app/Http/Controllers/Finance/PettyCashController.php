<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\FinanceAccount;
use App\Models\PettyCashCategory;
use App\Models\PettyCashEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PettyCashController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PettyCashEntry::query()->with(['branch', 'account', 'creator']);

        if ($request->filled('branch_id') && $request->string('branch_id')->toString() !== 'all') {
            $query->where('branch_id', $request->string('branch_id')->toString());
        }

        if ($request->filled('type') && $request->string('type')->toString() !== 'all') {
            $query->where('type', $request->string('type')->toString());
        }

        $entries = $query
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $cashReceived = PettyCashEntry::query()->where('type', 'reimbursement')->sum('total_amount');
        $totalUsage = PettyCashEntry::query()->where('type', 'usage')->sum('total_amount');

        return Inertia::render('finance/pettycash/index', [
            'entries' => $entries,
            'categories' => PettyCashCategory::query()->active()->orderBy('sort_order')->orderBy('name')->get(),
            'accounts' => FinanceAccount::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'account_type']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'availableBalance' => (float) ($cashReceived - $totalUsage),
            'cashReceived' => (float) $cashReceived,
            'totalUsage' => (float) $totalUsage,
            'usageCount' => PettyCashEntry::query()->where('type', 'usage')->count(),
            'filters' => $request->only(['branch_id', 'type', 'per_page']),
        ]);
    }

    public function storeEntry(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['reimbursement', 'usage'])],
            'petty_cash_category_id' => [
                Rule::requiredIf(fn () => $request->string('type')->toString() === 'usage'),
                'nullable',
                'exists:petty_cash_categories,id',
            ],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'entry_date' => ['required', 'date'],
            'particulars' => ['required', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'total_amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $entry = PettyCashEntry::create(array_merge($validated, ['created_by' => auth()->id()]));

        return redirect()->route('finance.pettycash.index')
            ->with('success', __('Petty cash entry recorded successfully.'));
    }

    public function destroyEntry(PettyCashEntry $entry): RedirectResponse
    {
        $entry->delete();

        return redirect()->route('finance.pettycash.index')
            ->with('success', __('Petty cash entry deleted successfully.'));
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        PettyCashCategory::create(array_merge($validated, [
            'created_by' => auth()->id(),
            'status' => 'active',
        ]));

        return redirect()->route('finance.pettycash.index')
            ->with('success', __('Category created successfully.'));
    }

    public function updateCategory(Request $request, PettyCashCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $category->update($validated);

        return redirect()->route('finance.pettycash.index')
            ->with('success', __('Category updated successfully.'));
    }

    public function destroyCategory(PettyCashCategory $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('finance.pettycash.index')
            ->with('success', __('Category deleted successfully.'));
    }
}
