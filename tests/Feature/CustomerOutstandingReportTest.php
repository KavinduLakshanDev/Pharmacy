<?php

use App\Enums\SaleStatus;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Customer;
use App\Models\SalesTransaction;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutCustomerOutstandingGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('filters customer outstanding report by type and search', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'manage-reports', 'guard_name' => 'web']);
    $user->givePermissionTo('manage-reports');

    $customer = Customer::query()->forceCreate([
        'name' => 'Anne Perera',
        'code' => 'CUST001',
        'type' => 'privileged_customer',
        'privileged_customer_number' => 'PC-0001',
        'current_balance' => 0,
    ]);

    $otherCustomer = Customer::query()->forceCreate([
        'name' => 'Bandara Shop',
        'code' => 'SHOP002',
        'type' => 'customer',
        'current_balance' => 0,
    ]);

    SalesTransaction::query()->create([
        'sale_no' => 'SO-0001',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-01',
        'sub_total' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 1000,
        'paid_amount' => 200,
        'balance_amount' => 800,
        'status' => SaleStatus::Completed->value,
        'payment_method' => 'Cash',
        'created_by' => $user->id,
    ]);

    SalesTransaction::query()->create([
        'sale_no' => 'SO-0002',
        'customer_id' => $otherCustomer->id,
        'sale_date' => '2026-05-01',
        'sub_total' => 500,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 500,
        'paid_amount' => 0,
        'balance_amount' => 500,
        'status' => SaleStatus::Completed->value,
        'payment_method' => 'Cash',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutCustomerOutstandingGuards($this)->get(route('reports.customer-outstanding', [
        'date' => '2026-05-12',
        'customer_type' => 'privileged_customer',
        'customer_id' => $customer->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/customer-outstanding-report')
        ->where('summary.total', 800)
        ->where('customers', fn ($customers) => count($customers) === 1)
        ->where('customers.0.name', 'Anne Perera')
        ->where('customers.0.code', 'CUST001')
        ->where('customers.0.total', 800)
        ->where('customerOptions.0.label', 'CUST001 - Anne Perera')
    );
});

it('includes partial sales and reflects reduced balance after customer payments', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'manage-reports', 'guard_name' => 'web']);
    $user->givePermissionTo('manage-reports');

    $customer = Customer::query()->forceCreate([
        'name' => 'Kumari Silva',
        'code' => 'CUST003',
        'type' => 'customer',
        'current_balance' => 0,
    ]);

    SalesTransaction::query()->create([
        'sale_no' => 'SO-0003',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-01',
        'sub_total' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 1000,
        'paid_amount' => 300,
        'balance_amount' => 700,
        'status' => SaleStatus::Partial->value,
        'payment_method' => 'Cash',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    withoutCustomerOutstandingGuards($this)->get(route('reports.customer-outstanding', [
        'date' => '2026-05-12',
        'customer_id' => $customer->id,
    ]))->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/customer-outstanding-report')
        ->where('summary.total', 700));

    $sale = SalesTransaction::query()->where('sale_no', 'SO-0003')->firstOrFail();
    $sale->update([
        'paid_amount' => round((float) $sale->paid_amount + 400, 2),
        'balance_amount' => round(max(0, (float) $sale->total_amount - ((float) $sale->paid_amount + 400)), 2),
    ]);

    withoutCustomerOutstandingGuards($this)->get(route('reports.customer-outstanding', [
        'date' => '2026-05-12',
        'customer_id' => $customer->id,
    ]))->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/customer-outstanding-report')
        ->where('summary.total', 300));
});
