<?php

use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Customer;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\Product;
use App\Models\SalesTransaction;
use App\Models\SalesTransactionItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutSalesReportGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('calculates sales cost profit and margin from sale transaction items', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'view-sales-reports', 'guard_name' => 'web']);
    $user->givePermissionTo('view-sales-reports');

    $customer = Customer::query()->create([
        'name' => 'Anne Perera',
        'code' => 'CUST001',
        'email' => 'anne@example.com',
        'phone' => '0771234567',
        'type' => 'customer',
    ]);

    $supplier = Supplier::factory()->create();
    $product = Product::query()->create([
        'name' => 'Adapco Gel 15g',
        'sku' => 'ADAPCO-15G',
        'price' => 15,
        'created_by' => $user->id,
    ]);

    $grn = Grn::query()->create([
        'grn_no' => 'GRN-001',
        'sup_id' => $supplier->id,
        'created_by' => $user->id,
        'grn_date' => '2026-05-01',
    ]);

    GrnItem::query()->create([
        'grn_id' => $grn->id,
        'product_id' => $product->id,
        'batch_no' => 'BATCH-001',
        'quantity' => 10,
        'unit_price' => 130,
        'total_price' => 1300,
        'unit_cost_price' => 12.50,
    ]);

    $sale = SalesTransaction::query()->create([
        'sale_no' => 'SALE-001',
        'customer_id' => $customer->id,
        'sale_date' => '2026-05-08',
        'status' => 'completed',
        'total_amount' => 750,
        'created_by' => $user->id,
    ]);

    SalesTransactionItem::query()->create([
        'sales_transaction_id' => $sale->id,
        'product_id' => $product->id,
        'batch_no' => 'BATCH-001',
        'quantity' => 50,
        'unit_price' => 15,
        'total_price' => 750,
        'discount_amount' => 25,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutSalesReportGuards($this)->get(route('reports.sales-report', [
        'date_from' => '2026-05-01',
        'date_to' => '2026-05-31',
        'status' => 'completed',
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/sales-report')
        ->where('summary.total_sales', 725)
        ->where('summary.total_cost', 625)
        ->where('summary.total_profit', 100)
        ->where('summary.profit_margin', 13.79)
        ->has('items', 1)
        ->where('items.0.sale_no', 'SALE-001')
        ->where('items.0.unit_cost_price', 12.5)
        ->where('items.0.net_sales', 725)
        ->where('items.0.cost_amount', 625)
        ->where('items.0.profit', 100)
    );
});
