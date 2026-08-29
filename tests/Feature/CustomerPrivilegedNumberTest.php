<?php

use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutCustomerPrivilegedNumberGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('stores privileged customer number for privileged customers', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'manage-customers', 'guard_name' => 'web']);
    Permission::query()->create(['name' => 'create-customers', 'guard_name' => 'web']);
    $user->givePermissionTo(['manage-customers', 'create-customers']);

    $this->actingAs($user);

    $response = withoutCustomerPrivilegedNumberGuards($this)->post(route('customers.store'), [
        'name' => 'Anne Perera',
        'email' => 'anne@example.com',
        'phone' => '0771234567',
        'address' => 'Main Street',
        'type' => 'privileged_customer',
        'privileged_customer_number' => 'PC-0001',
        'current_balance' => 1250.75,
    ]);

    $response->assertRedirect(route('customers.index'));
    $this->assertDatabaseHas('customers', [
        'name' => 'Anne Perera',
        'type' => 'privileged_customer',
        'privileged_customer_number' => 'PC-0001',
        'current_balance' => 1250.75,
    ]);
});

it('shows privileged customer number in the customer details report', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'view-customer-details-report', 'guard_name' => 'web']);
    $user->givePermissionTo('view-customer-details-report');

    Customer::query()->create([
        'name' => 'Anne Perera',
        'code' => 'CUST001',
        'email' => 'anne@example.com',
        'phone' => '0771234567',
        'type' => 'privileged_customer',
        'privileged_customer_number' => 'PC-0001',
        'created_at' => '2026-05-01 10:00:00',
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutCustomerPrivilegedNumberGuards($this)->get(route('reports.customer-details', [
        'date_from' => '2026-05-01',
        'date_to' => '2026-05-31',
        'search' => 'PC-0001',
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/customer-details-report')
        ->where('summary.total_customers', 1)
        ->where('customers.0.privileged_customer_number', 'PC-0001')
    );
});

it('quick stores privileged customer number for privileged customers in POS', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'manage-customers', 'guard_name' => 'web']);
    Permission::query()->create(['name' => 'create-customers', 'guard_name' => 'web']);
    $user->givePermissionTo(['manage-customers', 'create-customers']);

    $this->actingAs($user);

    $response = withoutCustomerPrivilegedNumberGuards($this)->post(route('customers.quick-store'), [
        'name' => 'POS Customer',
        'phone' => '0779998887',
        'address' => 'POS Lane',
        'type' => 'privileged_customer',
        'privileged_customer_number' => 'PC-9999',
    ]);

    $response->assertJsonStructure(['customer']);
    $this->assertDatabaseHas('customers', [
        'name' => 'POS Customer',
        'type' => 'privileged_customer',
        'privileged_customer_number' => 'PC-9999',
    ]);
});
