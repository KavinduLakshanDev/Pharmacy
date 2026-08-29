<?php

use App\Enums\StockTransferStatus;
use App\Enums\WastageStatus;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Wastage;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutInventoryDashboardGuards($test): mixed
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('renders the inventory dashboard with tenant-scoped statistics', function (): void {
    Permission::query()->firstOrCreate(['name' => 'manage-inventory', 'guard_name' => 'web']);
    Permission::query()->firstOrCreate(['name' => 'view-inventory-dashboard', 'guard_name' => 'web']);

    $company = User::factory()->create(['type' => 'company']);
    $company->givePermissionTo(['manage-inventory', 'view-inventory-dashboard']);

    Product::factory()->count(2)->create([
        'created_by' => $company->id,
        'status' => 'active',
        'stock_quantity' => 100,
        'reorder_level' => 10,
    ]);
    Product::factory()->create([
        'created_by' => $company->id,
        'status' => 'active',
        'stock_quantity' => 2,
        'reorder_level' => 10,
    ]);

    $branchA = Branch::query()->create([
        'created_by' => $company->id,
        'name' => 'Branch A',
        'status' => 'active',
    ]);
    $branchB = Branch::query()->create([
        'created_by' => $company->id,
        'name' => 'Branch B',
        'status' => 'active',
    ]);

    StockTransfer::query()->create([
        'transfer_no' => StockTransfer::generateTransferNo(),
        'from_branch_id' => $branchA->id,
        'to_branch_id' => $branchB->id,
        'transfer_date' => now()->toDateString(),
        'total_amount' => 0,
        'status' => StockTransferStatus::Pending,
        'created_by' => $company->id,
    ]);

    Wastage::query()->create([
        'wastage_no' => Wastage::generateWastageNo(),
        'branch_id' => null,
        'wastage_date' => now()->toDateString(),
        'total_amount' => 0,
        'status' => WastageStatus::Pending,
        'created_by' => $company->id,
    ]);

    $supplier = Supplier::factory()->create();
    $grnProduct = Product::factory()->create([
        'created_by' => $company->id,
        'status' => 'active',
        'stock_quantity' => 50,
        'reorder_level' => 5,
    ]);
    $grn = Grn::factory()->create([
        'created_by' => $company->id,
        'branch_id' => $branchA->id,
        'sup_id' => $supplier->id,
    ]);
    GrnItem::factory()->create([
        'grn_id' => $grn->id,
        'product_id' => $grnProduct->id,
    ]);

    $otherCompany = User::factory()->create(['type' => 'company']);
    Product::factory()->count(5)->create([
        'created_by' => $otherCompany->id,
        'status' => 'active',
    ]);

    $this->actingAs($company);
    $this->withoutVite();

    withoutInventoryDashboardGuards($this)->get(route('inventory.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('inventory/dashboard')
            ->where('stats.active_products', 4)
            ->where('stats.low_stock_products', 1)
            ->where('stats.pending_transfers', 1)
            ->where('stats.pending_wastages', 1)
            ->where('stats.grn_count', 1));
});
