<?php

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Branch;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;

function withoutCustomerReturnSearchGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('limits customer return additional-product search to items with positive stock', function () {
    $user = User::factory()->createOne(['type' => 'company']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $needle = 'CR-STOCK-FILTER-'.uniqid();

    $inStock = Product::query()->create([
        'name' => "Alpha {$needle}",
        'sku' => 'SKU-A-'.$needle,
        'price' => 50,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $noStock = Product::query()->create([
        'name' => "Beta {$needle}",
        'sku' => 'SKU-B-'.$needle,
        'price' => 50,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $inStock->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'transactionable_id' => 1,
        'stock_type' => null,
        'stock_type_id' => null,
        'quantity' => 5,
        'unit_price' => 50,
        'status' => MasterTransactionStatus::Completed,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = withoutCustomerReturnSearchGuards($this)->getJson(route('inventory.customer-returns.search-products', [
        'search' => $needle,
    ]));

    $response->assertOk();
    $ids = collect($response->json())->pluck('id')->all();
    expect($ids)->toContain($inStock->id)->not->toContain($noStock->id);
});

it('scopes customer return product search by branch stock when branch_id is provided', function () {
    $user = User::factory()->createOne(['type' => 'company']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $needle = 'CR-BRANCH-STOCK-'.uniqid();

    $branchWithStock = Branch::query()->create(['name' => 'Stock Branch '.$needle, 'created_by' => $user->id]);
    $otherBranch = Branch::query()->create(['name' => 'Empty Branch '.$needle, 'created_by' => $user->id]);

    $product = Product::query()->create([
        'name' => "Branch Scoped {$needle}",
        'sku' => 'SKU-BR-'.$needle,
        'price' => 40,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'transactionable_id' => 1,
        'stock_type' => MasterTransactionStockType::Branch,
        'stock_type_id' => $branchWithStock->id,
        'quantity' => 3,
        'unit_price' => 40,
        'status' => MasterTransactionStatus::Completed,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $hitsWrongBranch = withoutCustomerReturnSearchGuards($this)->getJson(route('inventory.customer-returns.search-products', [
        'search' => $needle,
        'branch_id' => $otherBranch->id,
    ]));
    $hitsWrongBranch->assertOk();
    expect(collect($hitsWrongBranch->json())->pluck('id')->all())->not->toContain($product->id);

    $hitsCorrectBranch = withoutCustomerReturnSearchGuards($this)->getJson(route('inventory.customer-returns.search-products', [
        'search' => $needle,
        'branch_id' => $branchWithStock->id,
    ]));
    $hitsCorrectBranch->assertOk();
    expect(collect($hitsCorrectBranch->json())->pluck('id')->all())->toContain($product->id);
});
