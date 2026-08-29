<?php

use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\PointsEarningRule;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Spatie\Permission\Models\Permission;

function withoutPointsEarningRuleGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('allows a company user with permission to save the points earning rule', function (): void {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->firstOrCreate(
        ['name' => 'manage-sales', 'guard_name' => 'web'],
    );
    $user->givePermissionTo('manage-sales');

    $this->actingAs($user);
    $this->withoutVite();

    withoutPointsEarningRuleGuards($this)->post(route('points-rules.store'), [
        'currency_amount' => 100,
        'points_earned' => 1,
        'redemption_points' => 1,
        'redemption_amount' => 1,
    ])->assertRedirect(route('points-rules.create'));

    $rule = PointsEarningRule::query()->where('created_by', $user->id)->first();
    expect($rule)->not->toBeNull()
        ->and((string) $rule->currency_amount)->toBe('100.00')
        ->and($rule->points_earned)->toEqual(1);
});

it('returns 403 when the user lacks permission', function (): void {
    $user = User::factory()->create(['type' => 'company']);

    $this->actingAs($user);
    $this->withoutVite();

    withoutPointsEarningRuleGuards($this)->post(route('points-rules.store'), [
        'currency_amount' => 100,
        'points_earned' => 1,
        'redemption_points' => 1,
        'redemption_amount' => 1,
    ])->assertForbidden();
});

it('floors partial points when calculating bill points', function (): void {
    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
    ]);

    expect(PointsEarningRule::pointsForBillAmount(499.99, $user->id))->toEqual(4.99)
        ->and(PointsEarningRule::pointsForBillAmount(500, $user->id))->toEqual(5)
        ->and(PointsEarningRule::pointsForBillAmount(0, $user->id))->toEqual(0);
});

use App\Models\Customer;
use App\Models\SalesTransaction;

it('awards points to privileged customers if enable_privileged_points is enabled', function (): void {
    // 1. Create/Get Super Admin and enable feature
    $superAdmin = User::where('type', 'superadmin')->first() ?? User::factory()->create(['type' => 'superadmin']);
    updateSetting('enable_privileged_points', '1', $superAdmin->id);

    // 2. Create Company user and their Points Earning Rule
    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
    ]);

    // 3. Create Privileged Customer
    $customer = Customer::query()->create([
        'user_id' => $user->id,
        'name' => 'John Doe',
        'code' => 'PCUST001',
        'email' => 'john@example.com',
        'phone' => '0779998888',
        'type' => 'privileged_customer',
        'points' => 10,
    ]);

    // 4. Create Completed Sale
    $sale = SalesTransaction::query()->create([
        'sale_no' => 'SALE-PC-001',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-18',
        'status' => 'completed',
        'sub_total' => 500,
        'total_amount' => 500,
        'created_by' => $user->id,
    ]);

    $customer->refresh();
    $sale->refresh();

    expect($sale->points_earned)->toEqual(5)
        ->and($customer->points)->toEqual(15);
});

it('does not award points to privileged customers if enable_privileged_points is disabled', function (): void {
    // 1. Create/Get Super Admin and disable feature
    $superAdmin = User::where('type', 'superadmin')->first() ?? User::factory()->create(['type' => 'superadmin']);
    updateSetting('enable_privileged_points', '0', $superAdmin->id);

    // 2. Create Company user and their Points Earning Rule
    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
    ]);

    // 3. Create Privileged Customer
    $customer = Customer::query()->create([
        'user_id' => $user->id,
        'name' => 'John Doe 2',
        'code' => 'PCUST002',
        'email' => 'john2@example.com',
        'phone' => '0779998889',
        'type' => 'privileged_customer',
        'points' => 10,
    ]);

    // 4. Create Completed Sale
    $sale = SalesTransaction::query()->create([
        'sale_no' => 'SALE-PC-002',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-18',
        'status' => 'completed',
        'sub_total' => 500,
        'total_amount' => 500,
        'created_by' => $user->id,
    ]);

    $customer->refresh();
    $sale->refresh();

    expect($sale->points_earned)->toEqual(0)
        ->and($customer->points)->toEqual(10);
});

it('does not award points to standard customers', function (): void {
    $superAdmin = User::where('type', 'superadmin')->first() ?? User::factory()->create(['type' => 'superadmin']);
    updateSetting('enable_privileged_points', '1', $superAdmin->id);

    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
    ]);

    // Standard Customer
    $customer = Customer::query()->create([
        'user_id' => $user->id,
        'name' => 'Standard Customer',
        'code' => 'CUST003',
        'email' => 'std@example.com',
        'phone' => '0779998887',
        'type' => 'customer',
        'points' => 10,
    ]);

    $sale = SalesTransaction::query()->create([
        'sale_no' => 'SALE-PC-003',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-18',
        'status' => 'completed',
        'sub_total' => 500,
        'total_amount' => 500,
        'created_by' => $user->id,
    ]);

    $customer->refresh();
    $sale->refresh();

    expect($sale->points_earned)->toEqual(0)
        ->and($customer->points)->toEqual(10);
});

it('reverts points when sale is cancelled or deleted', function (): void {
    $superAdmin = User::where('type', 'superadmin')->first() ?? User::factory()->create(['type' => 'superadmin']);
    updateSetting('enable_privileged_points', '1', $superAdmin->id);

    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
    ]);

    $customer = Customer::query()->create([
        'user_id' => $user->id,
        'name' => 'John Doe 3',
        'code' => 'PCUST003',
        'email' => 'john3@example.com',
        'phone' => '0779998810',
        'type' => 'privileged_customer',
        'points' => 10,
    ]);

    $sale = SalesTransaction::query()->create([
        'sale_no' => 'SALE-PC-004',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-18',
        'status' => 'completed',
        'sub_total' => 500,
        'total_amount' => 500,
        'created_by' => $user->id,
    ]);

    $customer->refresh();
    expect($customer->points)->toEqual(15);

    // Cancel sale -> should revert points
    $sale->update(['status' => 'cancelled']);
    $customer->refresh();
    expect($customer->points)->toEqual(10);

    // Re-complete sale -> should re-award points
    $sale->update(['status' => 'completed']);
    $customer->refresh();
    expect($customer->points)->toEqual(15);

    // Delete sale -> should revert points
    $sale->delete();
    $customer->refresh();
    expect($customer->points)->toEqual(10);
});

it('saves points redemption configurations successfully', function (): void {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->firstOrCreate(
        ['name' => 'manage-sales', 'guard_name' => 'web'],
    );
    $user->givePermissionTo('manage-sales');

    $this->actingAs($user);
    $this->withoutVite();

    withoutPointsEarningRuleGuards($this)->post(route('points-rules.store'), [
        'currency_amount' => 100,
        'points_earned' => 1,
        'redemption_points' => 10,
        'redemption_amount' => 5,
    ])->assertRedirect(route('points-rules.create'));

    $rule = PointsEarningRule::query()->where('created_by', $user->id)->first();
    expect($rule)->not->toBeNull()
        ->and(floatval($rule->redemption_points))->toEqual(10.0)
        ->and(floatval($rule->redemption_amount))->toEqual(5.0);
});

it('performs points-to-cash conversions using rules', function (): void {
    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
        'redemption_points' => 20,
        'redemption_amount' => 1,
    ]);

    expect(PointsEarningRule::pointsToCash(100, $user->id))->toEqual(5)
        ->and(PointsEarningRule::cashToPoints(10, $user->id))->toEqual(200);
});

it('deducts redeemed points and awards newly earned points on net bill amount', function (): void {
    $superAdmin = User::where('type', 'superadmin')->first() ?? User::factory()->create(['type' => 'superadmin']);
    updateSetting('enable_privileged_points', '1', $superAdmin->id);

    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
        'redemption_points' => 10,
        'redemption_amount' => 1, // 10 pts = Rs 1
    ]);

    $customer = Customer::query()->create([
        'user_id' => $user->id,
        'name' => 'Jane Smith',
        'code' => 'PCUST999',
        'type' => 'privileged_customer',
        'points' => 150, // Rs 15 worth
    ]);

    // Create a sale where they redeem 100 points (Rs 10 discount) on a Rs 1010 subtotal
    $sale = SalesTransaction::query()->create([
        'sale_no' => 'SALE-RED-01',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-18',
        'status' => 'completed',
        'sub_total' => 1010,
        'points_redeemed' => 100,
        'points_redeemed_amount' => 10,
        'total_amount' => 1000, // 1010 subtotal - 10 points redeemed = 1000 net bill
        'created_by' => $user->id,
    ]);

    $customer->refresh();
    $sale->refresh();

    // 150 starting points - 100 redeemed + 10 earned (on 1000 net bill) = 60 points
    expect($sale->points_earned)->toEqual(10)
        ->and($customer->points)->toEqual(60)
        ->and((string) $sale->total_amount)->toBe('1000.00');
});

it('refunds redeemed points when sale is cancelled or deleted', function (): void {
    $superAdmin = User::where('type', 'superadmin')->first() ?? User::factory()->create(['type' => 'superadmin']);
    updateSetting('enable_privileged_points', '1', $superAdmin->id);

    $user = User::factory()->create(['type' => 'company']);
    PointsEarningRule::query()->create([
        'created_by' => $user->id,
        'currency_amount' => 100,
        'points_earned' => 1,
        'redemption_points' => 10,
        'redemption_amount' => 1,
    ]);

    $customer = Customer::query()->create([
        'user_id' => $user->id,
        'name' => 'Jane Smith 2',
        'code' => 'PCUST998',
        'type' => 'privileged_customer',
        'points' => 150,
    ]);

    $sale = SalesTransaction::query()->create([
        'sale_no' => 'SALE-RED-02',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-18',
        'status' => 'completed',
        'sub_total' => 1010,
        'points_redeemed' => 100,
        'points_redeemed_amount' => 10,
        'total_amount' => 1000,
        'created_by' => $user->id,
    ]);

    $customer->refresh();
    expect($customer->points)->toEqual(60); // 150 - 100 + 10 = 60

    // Cancel transaction -> Points should be reverted/refunded (starts from 150, earned 0 = 150)
    $sale->update(['status' => 'cancelled']);
    $customer->refresh();
    expect($customer->points)->toEqual(150);

    // Re-complete -> returns to 60
    $sale->update(['status' => 'completed', 'points_redeemed' => 100, 'points_redeemed_amount' => 10]);
    $customer->refresh();
    expect($customer->points)->toEqual(60);

    // Soft delete -> refunds points back to 150
    $sale->delete();
    $customer->refresh();
    expect($customer->points)->toEqual(150);
});
