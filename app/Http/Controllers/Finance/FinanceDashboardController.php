<?php

namespace App\Http\Controllers\Finance;

use App\Enums\FinanceAccountStatus;
use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $companyId = $user->creatorId();

        $accountsQuery = FinanceAccount::query()->where('created_by', $companyId);

        $accountIds = (clone $accountsQuery)->pluck('id');

        $transactionsQuery = FinanceTransaction::query()
            ->when(
                $accountIds->isEmpty(),
                fn (Builder $builder): Builder => $builder->whereRaw('0 = 1'),
                fn (Builder $builder): Builder => $builder->whereIn('finance_account_id', $accountIds),
            );

        $totalAccounts = (clone $accountsQuery)->count();
        $activeAccounts = (clone $accountsQuery)->where('status', FinanceAccountStatus::Active->value)->count();
        $totalTransactions = (clone $transactionsQuery)->count();

        $accounts = (clone $accountsQuery)
            ->orderBy('name')
            ->get()
            ->map(fn (FinanceAccount $account): array => [
                'id' => $account->id,
                'name' => $account->name,
                'account_type' => $account->account_type->value,
                'status' => $account->status->value,
                'balance' => $account->balance(),
            ]);

        $totalBalance = $accounts->sum('balance');
        $totalCredits = (clone $transactionsQuery)->where('type', 'credit')->sum('amount');
        $totalDebits = (clone $transactionsQuery)->where('type', 'debit')->sum('amount');

        $recentTransactions = (clone $transactionsQuery)
            ->with(['account', 'creator'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (FinanceTransaction $transaction): array => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'amount' => (string) $transaction->amount,
                'description' => $transaction->description,
                'reference' => $transaction->reference,
                'transaction_date' => optional($transaction->transaction_date)?->toIso8601String(),
                'transaction_date_short' => optional($transaction->transaction_date)?->format('Y-m-d'),
                'account' => $transaction->account ? ['id' => $transaction->account->id, 'name' => $transaction->account->name] : null,
            ]);

        $txnConnection = $transactionsQuery->getConnection();
        $driver = $txnConnection->getDriverName();
        $monthSql = match ($driver) {
            'sqlite' => "strftime('%Y-%m', transaction_date)",
            default => "DATE_FORMAT(transaction_date, '%Y-%m')",
        };

        $monthlyTransactions = (clone $transactionsQuery)
            ->selectRaw("{$monthSql} as month,
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as credits,
                SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as debits")
            ->where('transaction_date', '>=', now()->subMonths(6)->startOfMonth())
            ->groupByRaw($monthSql)
            ->orderBy('month')
            ->get();

        $typeDistribution = (clone $transactionsQuery)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->get();

        $accountTypeDistribution = $accounts
            ->groupBy('account_type')
            ->map(fn ($group): float => (float) $group->sum('balance'));

        return Inertia::render('finance/dashboard', [
            'stats' => [
                'totalAccounts' => $totalAccounts,
                'activeAccounts' => $activeAccounts,
                'totalTransactions' => $totalTransactions,
                'totalBalance' => (float) $totalBalance,
                'totalCredits' => (float) $totalCredits,
                'totalDebits' => (float) $totalDebits,
            ],
            'accounts' => $accounts->values()->all(),
            'recentTransactions' => $recentTransactions->all(),
            'quickLinks' => $this->quickLinksPayload($user),
            'reportLinks' => $this->financeReportLinksPayload($user),
            'charts' => [
                'monthlyTransactions' => $monthlyTransactions,
                'transactionTypeDistribution' => $typeDistribution,
                'accountTypeDistribution' => $accountTypeDistribution,
            ],
        ]);
    }

    /**
     * @return array<int, array{title: string, description: string, href: string, icon: string, visible: bool}>
     */
    private function quickLinksPayload(User $user): array
    {
        $canInventoryPayments = $user->can('manage-inventory') && $user->can('view-inventory-transactions');

        return [
            [
                'title' => 'Accounts',
                'description' => 'Bank, cash & card registers',
                'href' => route('finance.accounts.index'),
                'icon' => 'landmark',
                'visible' => true,
            ],
            [
                'title' => 'Transactions',
                'description' => 'Journal entries & movements',
                'href' => route('finance.transactions.index'),
                'icon' => 'arrow-right-left',
                'visible' => true,
            ],
            [
                'title' => 'Petty Cash',
                'description' => 'Expense float & approvals',
                'href' => route('finance.pettycash.index'),
                'icon' => 'coins',
                'visible' => true,
            ],
            [
                'title' => 'Customer Payments',
                'description' => 'Receive against credit sales',
                'href' => route('inventory.customer-payments.index'),
                'icon' => 'banknote',
                'visible' => $canInventoryPayments,
            ],
            [
                'title' => 'Supplier Payments',
                'description' => 'Pay vendors & allocations',
                'href' => route('inventory.supplier-payments.index'),
                'icon' => 'building-2',
                'visible' => $canInventoryPayments,
            ],
        ];
    }

    /**
     * @return array<int, array{title: string, description: string, href: string, icon: string, visible: bool}>
     */
    private function financeReportLinksPayload(User $user): array
    {
        $manageReports = $user->can('manage-reports');

        return [
            [
                'title' => 'Cash Collection',
                'description' => 'Daily cash & cheque inflows',
                'href' => route('reports.cash-collection'),
                'icon' => 'layers',
                'visible' => $manageReports || $user->can('view-cash-collection-report'),
            ],
            [
                'title' => 'Customer Ledger',
                'description' => 'Outstanding & running balance',
                'href' => route('reports.customer-ledger-card'),
                'icon' => 'notebook-text',
                'visible' => $manageReports || $user->can('view-customer-ledger-card'),
            ],
            [
                'title' => 'Supplier Ledger',
                'description' => 'Vendor account activity',
                'href' => route('reports.supplier-ledger-card'),
                'icon' => 'scroll-text',
                'visible' => $manageReports || $user->can('view-supplier-ledger-card'),
            ],
            [
                'title' => 'Customer Outstanding',
                'description' => 'Aged receivables',
                'href' => route('reports.customer-outstanding'),
                'icon' => 'clipboard-list',
                'visible' => $manageReports,
            ],
            [
                'title' => 'Customer Statement',
                'description' => 'Customer details & ageing',
                'href' => route('reports.customer-details'),
                'icon' => 'users',
                'visible' => $manageReports || $user->can('view-customer-details-report'),
            ],
            [
                'title' => 'Supplier Statement',
                'description' => 'Supplier details & summaries',
                'href' => route('reports.supplier-details'),
                'icon' => 'warehouse',
                'visible' => $manageReports || $user->can('view-supplier-details-report'),
            ],
            [
                'title' => 'Sales Report',
                'description' => 'Revenue by period',
                'href' => route('reports.sales-report'),
                'icon' => 'chart-line',
                'visible' => $manageReports || $user->can('view-sales-reports'),
            ],
        ];
    }
}
