<?php

use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\SalesTransaction;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutCustomerLedgerCardGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('shows sales and customer payments in the customer ledger card', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'view-customer-ledger-card', 'guard_name' => 'web']);
    $user->givePermissionTo('view-customer-ledger-card');

    $customer = Customer::query()->create([
        'name' => 'Ledger Test Customer',
        'code' => 'CLC-001',
        'email' => 'ledger@example.com',
        'phone' => '0770000000',
        'type' => 'customer',
    ]);

    SalesTransaction::query()->create([
        'sale_no' => 'SALE-CLC-001',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-01',
        'status' => 'completed',
        'total_amount' => 1000,
        'paid_amount' => 0,
        'created_by' => $user->id,
    ]);

    CustomerPayment::query()->create([
        'customer_id' => $customer->id,
        'payment_method' => 'cash',
        'paid_amount' => 300,
        'payment_date' => '2026-05-02',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutCustomerLedgerCardGuards($this)->get(route('reports.customer-ledger-card', [
        'date_from' => '2026-05-01',
        'date_to' => '2026-05-31',
        'customer_id' => $customer->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/customer-ledger-card')
        ->where('summary.opening_balance', 0)
        ->where('summary.total_debits', 1300)
        ->where('summary.total_credits', 0)
        ->where('summary.closing_balance', 1300)
        ->has('ledgerEntries', 2)
        ->where('ledgerEntries.0.reference', 'SALE-CLC-001')
        ->where('ledgerEntries.0.debit', 1000)
        ->where('ledgerEntries.0.credit', 0)
        ->where('ledgerEntries.0.balance', 1000)
        ->where('ledgerEntries.1.description', 'Customer Payment - cash')
        ->where('ledgerEntries.1.debit', 300)
        ->where('ledgerEntries.1.credit', 0)
        ->where('ledgerEntries.1.balance', 1300)
    );
});
