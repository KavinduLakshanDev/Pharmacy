<?php

use App\Enums\FinanceAccountStatus;
use App\Enums\FinanceAccountType;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutFinanceDashboardGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('renders finance dashboard scoped to the company and includes navigation payloads', function (): void {
    $user = User::factory()->create(['type' => 'company']);

    Permission::query()->firstOrCreate(['name' => 'manage-finance', 'guard_name' => 'web']);
    $user->givePermissionTo('manage-finance');

    $account = FinanceAccount::query()->create([
        'created_by' => $user->id,
        'name' => 'Main Bank',
        'account_type' => FinanceAccountType::Bank->value,
        'status' => FinanceAccountStatus::Active->value,
        'branch_id' => null,
    ]);

    FinanceTransaction::query()->create([
        'finance_account_id' => $account->id,
        'branch_id' => null,
        'created_by' => $user->id,
        'amount' => 100,
        'type' => 'credit',
        'description' => 'Test inflow',
        'transaction_date' => now(),
        'reference' => null,
    ]);

    $other = User::factory()->create(['type' => 'company']);
    $otherAccount = FinanceAccount::query()->create([
        'created_by' => $other->id,
        'name' => 'Other Org',
        'account_type' => FinanceAccountType::Bank->value,
        'status' => FinanceAccountStatus::Active->value,
        'branch_id' => null,
    ]);
    FinanceTransaction::query()->create([
        'finance_account_id' => $otherAccount->id,
        'branch_id' => null,
        'created_by' => $other->id,
        'amount' => 999,
        'type' => 'credit',
        'description' => 'Noise',
        'transaction_date' => now(),
        'reference' => null,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    withoutFinanceDashboardGuards($this)->get(route('finance.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('finance/dashboard')
            ->where('stats.totalAccounts', 1)
            ->where('stats.totalTransactions', 1)
            ->where('stats.totalCredits', 100)
            ->has('accounts', 1)
            ->has('quickLinks', 5)
            ->has('reportLinks', 7));
});
