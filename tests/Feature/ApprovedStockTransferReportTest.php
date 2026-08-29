<?php

use App\Enums\StockTransferStatus;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Branch;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutApprovedStockTransferReportGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('shows only approved stock transfer items', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::findOrCreate('manage-reports', 'web');
    $user->givePermissionTo('manage-reports');

    $sourceBranch = Branch::query()->create([
        'created_by' => $user->id,
        'name' => 'Source Branch',
        'status' => 'active',
    ]);
    $destBranch = Branch::query()->create([
        'created_by' => $user->id,
        'name' => 'Dest Branch',
        'status' => 'active',
    ]);
    $product = Product::query()->create([
        'name' => 'Transfer Product',
        'sku' => 'TR-001',
        'price' => 100,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $approvedTransfer = StockTransfer::factory()->create([
        'from_branch_id' => $sourceBranch->id,
        'to_branch_id' => $destBranch->id,
        'transfer_no' => 'ST-APP-001',
        'transfer_date' => '2026-05-10',
        'status' => StockTransferStatus::Approved,
        'created_by' => $user->id,
    ]);

    StockTransferItem::factory()->create([
        'stock_transfer_id' => $approvedTransfer->id,
        'product_id' => $product->id,
        'batch_no' => 'BATCH-001',
        'quantity' => 5,
        'unit_cost_price' => 12.5,
    ]);

    $acceptedTransfer = StockTransfer::factory()->create([
        'from_branch_id' => $sourceBranch->id,
        'to_branch_id' => $destBranch->id,
        'transfer_no' => 'ST-ACC-001',
        'transfer_date' => '2026-05-10',
        'status' => StockTransferStatus::Accepted,
        'created_by' => $user->id,
    ]);

    StockTransferItem::factory()->create([
        'stock_transfer_id' => $acceptedTransfer->id,
        'product_id' => $product->id,
        'batch_no' => 'BATCH-002',
        'quantity' => 3,
        'unit_cost_price' => 10.0,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutApprovedStockTransferReportGuards($this)->get(route('reports.approved-stock-transfers'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/approved-stock-transfer-report')
        ->has('items', 1)
        ->where('items.0.transfer_no', 'ST-APP-001')
        ->where('items.0.batch_no', 'BATCH-001')
        ->where('items.0.quantity', 5)
        ->where('items.0.unit_cost_price', 12.5)
    );
});
