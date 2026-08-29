<?php

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnItem;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Models\Permission;

function withoutSupplierReturnGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
        PermissionMiddleware::class,
    ]);
}

it('renders the supplier returns inventory page', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);

    $response = withoutSupplierReturnGuards($this)->actingAs($user)->get(route('inventory.supplier-returns.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('inventory/supplier-returns/index')
    );
});

it('renders the supplier return create page', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);

    $response = withoutSupplierReturnGuards($this)->actingAs($user)->get(route('inventory.supplier-returns.create'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('inventory/supplier-returns/create')
    );
});

it('can search suppliers for supplier returns', function () {
    Supplier::factory()->create(['company_name' => 'Alpha Supplies']);
    Supplier::factory()->create(['company_name' => 'Beta Traders']);

    $response = withoutSupplierReturnGuards($this)->get(route('inventory.supplier-returns.search-suppliers', ['search' => 'Alpha']));

    $response->assertOk();
    $response->assertJsonFragment(['AdrCd' => 'Alpha Supplies']);
});

it('returns GRNs for the selected supplier', function () {
    $supplier = Supplier::factory()->create();
    Grn::factory()->create(['sup_id' => $supplier->id, 'invoice_no' => 'INV-001']);

    $response = withoutSupplierReturnGuards($this)->get(route('inventory.supplier-returns.grns', $supplier));

    $response->assertOk();
    $response->assertJsonFragment(['invoice_no' => 'INV-001']);
});

it('returns GRN item details when a supplier invoice is selected', function () {
    $supplier = Supplier::factory()->create();
    $grn = Grn::factory()->create(['sup_id' => $supplier->id, 'invoice_no' => 'INV-002']);
    $grnItem = GrnItem::factory()->for($grn)->create(['quantity' => 5, 'unit_price' => 20]);

    $response = withoutSupplierReturnGuards($this)->get(route('inventory.supplier-returns.grn-details', $grn));

    $response->assertOk();
    $response->assertJsonFragment(['product_name' => $grnItem->product->name]);
});

it('stores a supplier return with returned quantities', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);
    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $supplier = Supplier::factory()->create();
    $grn = Grn::factory()->create(['sup_id' => $supplier->id, 'invoice_no' => 'INV-003']);
    $grnItem = GrnItem::factory()->for($grn)->create([
        'quantity' => 10,
        'unit_price' => 15,
        'batch_no' => 'BATCH-001',
    ]);

    MasterTransaction::query()->create([
        'product_id' => $grnItem->product_id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'transactionable_id' => $grn->id,
        'stock_type' => $grn->branch_id ? MasterTransactionStockType::Branch : null,
        'stock_type_id' => $grn->branch_id,
        'quantity' => 10,
        'unit_price' => 15,
        'batch_no' => 'BATCH-001',
        'status' => MasterTransactionStatus::Completed,
        'created_by' => $user->id,
    ]);

    $response = withoutSupplierReturnGuards($this)->actingAs($user)->post(route('inventory.supplier-returns.store'), [
        'supplier_id' => $supplier->id,
        'grn_id' => $grn->id,
        'return_date' => now()->toDateString(),
        'notes' => 'Damaged stock return',
        'products' => [
            [
                'grn_item_id' => $grnItem->id,
                'product_id' => $grnItem->product_id,
                'quantity' => 2,
                'unit_price' => $grnItem->unit_price,
                'batch_no' => $grnItem->batch_no,
                'expiry_date' => optional($grnItem->expiry_date)->toDateString(),
            ],
        ],
    ]);

    $response->assertRedirect(route('inventory.supplier-returns.index'));
    $this->assertDatabaseHas('supplier_returns', ['supplier_id' => $supplier->id, 'grn_id' => $grn->id]);
    $this->assertDatabaseHas('supplier_return_items', ['grn_item_id' => $grnItem->id, 'quantity' => 2]);
    $this->assertDatabaseHas('master_transactions', [
        'product_id' => $grnItem->product_id,
        'transaction_type' => MasterTransactionType::Out->value,
        'transactionable_type' => MasterTransactionSourceType::SupplierReturn->value,
        'batch_no' => 'BATCH-001',
        'created_by' => $user->id,
    ]);

    $response = withoutSupplierReturnGuards($this)->actingAs($user)->get(route('inventory.stock-in-hand'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('inventory/stock-in-hand')
        ->has('stockInHand.data', 1)
        ->where('stockInHand.data.0.current_stock', 8)
    );
});

it('shows supplier return history on the index page', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);
    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $supplier = Supplier::factory()->create();
    $grn = Grn::factory()->create(['sup_id' => $supplier->id, 'invoice_no' => 'INV-004']);
    $product = Product::factory()->create(['created_by' => $user->id]);
    $grnItem = GrnItem::factory()->for($grn)->create([
        'product_id' => $product->id,
        'batch_no' => 'BATCH-002',
    ]);

    $supplierReturn = SupplierReturn::query()->create([
        'return_number' => 'SRN-20260507-000999',
        'supplier_id' => $supplier->id,
        'grn_id' => $grn->id,
        'return_date' => now()->toDateString(),
        'notes' => 'Damaged packaging',
        'status' => 'processed',
        'sub_total' => 12.50,
        'total_amount' => 12.50,
        'created_by' => $user->id,
    ]);

    SupplierReturnItem::query()->create([
        'supplier_return_id' => $supplierReturn->id,
        'grn_item_id' => $grnItem->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'unit_price' => 12.50,
        'total_price' => 12.50,
        'batch_no' => 'BATCH-002',
        'expiry_date' => null,
    ]);

    $response = withoutSupplierReturnGuards($this)->actingAs($user)->get(route('inventory.supplier-returns.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('inventory/supplier-returns/index')
        ->has('supplierReturns.data', 1)
        ->where('supplierReturns.data.0.return_number', 'SRN-20260507-000999')
    );
});
