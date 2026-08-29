<?php

use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutPriceDetailsReportGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('renders all products and includes batch branch details when available', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'view-price-details-report', 'guard_name' => 'web']);
    $user->givePermissionTo('view-price-details-report');

    $branch = Branch::query()->create([
        'created_by' => $user->id,
        'name' => 'Main Branch',
        'status' => 'active',
    ]);

    $supplier = Supplier::factory()->create();

    $batchedProduct = Product::query()->create([
        'name' => 'Adapco Gel 15g',
        'sku' => 'ADAPCO-15G',
        'price' => 150,
        'created_by' => $user->id,
    ]);

    $productWithoutBatch = Product::query()->create([
        'name' => 'No Batch Product',
        'sku' => 'NO-BATCH',
        'price' => 75,
        'created_by' => $user->id,
    ]);

    $grn = Grn::query()->create([
        'grn_no' => 'GRN-001',
        'batch_no' => 'GRN-BATCH',
        'sup_id' => $supplier->id,
        'branch_id' => $branch->id,
        'created_by' => $user->id,
        'grn_date' => '2026-05-01',
    ]);

    GrnItem::query()->create([
        'grn_id' => $grn->id,
        'product_id' => $batchedProduct->id,
        'batch_no' => 'BN05086',
        'quantity' => 50,
        'unit_price' => 130,
        'total_price' => 6500,
        'unit_cost_price' => 12.50,
        'unit_sales_price' => 15,
        'unit_stock' => 520,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutPriceDetailsReportGuards($this)->get(route('reports.price-details'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/price-details-report')
        ->where('summary.total_items', 2)
        ->where('summary.total_products', 2)
        ->where('summary.total_batches', 1)
        ->has('priceDetails', 2)
        ->where('priceDetails.0.product_name', 'Adapco Gel 15g')
        ->where('priceDetails.0.price', 150)
        ->where('priceDetails.0.batch_no', 'BN05086')
        ->where('priceDetails.0.branch_name', 'Main Branch')
        ->where('priceDetails.0.available_stock', 520)
        ->where('priceDetails.1.product_name', 'No Batch Product')
        ->where('priceDetails.1.price', 75)
        ->where('priceDetails.1.batch_no', null)
        ->where('priceDetails.1.branch_name', null)
    );
});

it('filters price details by branch', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'view-price-details-report', 'guard_name' => 'web']);
    $user->givePermissionTo('view-price-details-report');

    $branch = Branch::query()->create([
        'created_by' => $user->id,
        'name' => 'Main Branch',
        'status' => 'active',
    ]);

    $otherBranch = Branch::query()->create([
        'created_by' => $user->id,
        'name' => 'Other Branch',
        'status' => 'active',
    ]);

    $supplier = Supplier::factory()->create();
    $product = Product::query()->create([
        'name' => 'Adapco Gel 15g',
        'sku' => 'ADAPCO-15G',
        'price' => 150,
        'created_by' => $user->id,
    ]);

    foreach ([[$branch, 'BN05086'], [$otherBranch, 'BN99999']] as [$grnBranch, $batchNo]) {
        $grn = Grn::query()->create([
            'grn_no' => "GRN-{$batchNo}",
            'sup_id' => $supplier->id,
            'branch_id' => $grnBranch->id,
            'created_by' => $user->id,
            'grn_date' => '2026-05-01',
        ]);

        GrnItem::query()->create([
            'grn_id' => $grn->id,
            'product_id' => $product->id,
            'batch_no' => $batchNo,
            'quantity' => 10,
            'unit_price' => 130,
            'total_price' => 1300,
        ]);
    }

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutPriceDetailsReportGuards($this)->get(route('reports.price-details', [
        'branch_id' => $branch->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/price-details-report')
        ->where('summary.total_items', 1)
        ->where('priceDetails.0.batch_no', 'BN05086')
        ->where('priceDetails.0.branch_name', 'Main Branch')
    );
});
