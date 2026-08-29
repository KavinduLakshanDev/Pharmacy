<?php

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionType;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

test('guests are redirected from inventory transactions route', function () {
    $response = get(route('inventory.transactions.index'));

    $response->assertRedirect('/login');
});

test('authorized users can view inventory transactions index page', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $product = Product::query()->create([
        'name' => 'Inventory Product',
        'sku' => 'INV-TEST-001',
        'price' => 50,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 15,
        'unit_price' => 12.50,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.transactions.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/transactions/index')
        ->has('transactions.data', 1)
        ->where('transactions.data.0.product.name', 'Inventory Product')
    );
});

test('inventory transactions page supports filtering by transaction type', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $product = Product::query()->create([
        'name' => 'Filter Product',
        'sku' => 'INV-TEST-002',
        'price' => 50,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 20,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::Out,
        'transactionable_type' => MasterTransactionSourceType::UsageNote,
        'quantity' => 5,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.transactions.index', [
        'transaction_type' => MasterTransactionType::Out->value,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/transactions/index')
        ->has('transactions.data', 1)
        ->where('transactions.data.0.transaction_type', MasterTransactionType::Out->value)
    );
});
test('authorized users can view stock in hand report', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $product = Product::query()->create([
        'name' => 'Stock Product',
        'sku' => 'INV-TEST-003',
        'price' => 50,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 10,
        'unit_price' => 12.5,
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::Out,
        'transactionable_type' => MasterTransactionSourceType::UsageNote,
        'quantity' => 3,
        'unit_price' => 12.5,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('stock-in-hand.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('stock-in-hand/index')
        ->has('stockRows.data', 1)
        ->where('stockRows.data.0.stock_in_hand', 7)
    );
});

test('stock in hand report filters by expiry status', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $branch = Branch::query()->create([
        'created_by' => $user->id,
        'name' => 'Expiry Branch',
        'address' => '123 Test Street',
        'phone' => '0000000000',
        'email' => 'expiry-branch@example.com',
        'status' => 'active',
    ]);
    $supplier = Supplier::factory()->create();

    $batches = [
        [
            'name' => 'Expired Product',
            'sku' => 'EXP-001',
            'batch' => 'BATCH-EXPIRED',
            'expiry' => now()->subDay()->toDateString(),
            'filter' => 'expired',
        ],
        [
            'name' => 'Short Expiry Product',
            'sku' => 'EXP-002',
            'batch' => 'BATCH-SHORT',
            'expiry' => now()->addMonths(2)->toDateString(),
            'filter' => 'short_expiry',
        ],
        [
            'name' => 'Long Expiry Product',
            'sku' => 'EXP-003',
            'batch' => 'BATCH-LONG',
            'expiry' => now()->addMonths(4)->toDateString(),
            'filter' => 'long_expiry',
        ],
    ];

    foreach ($batches as $batch) {
        $product = Product::query()->create([
            'name' => $batch['name'],
            'sku' => $batch['sku'],
            'price' => 50,
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        $grn = Grn::query()->create([
            'grn_no' => 'GRN-'.strtoupper(str_replace('-', '', $batch['batch'])),
            'batch_no' => $batch['batch'],
            'sup_id' => $supplier->id,
            'branch_id' => $branch->id,
            'created_by' => $user->id,
            'grn_date' => now()->toDateString(),
            'sub_total' => 100,
            'discount_amount' => 0,
            'total_amount' => 100,
            'paid_amount' => 100,
            'description' => 'Expiry filter test',
            'status' => \App\Enums\GrnStatus::Approved->value,
        ]);

        GrnItem::query()->create([
            'grn_id' => $grn->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'unit_price' => 10,
            'total_price' => 100,
            'discount_type' => null,
            'discount_value' => 0,
            'discount_amount' => 0,
            'expiry_date' => $batch['expiry'],
            'batch_no' => $batch['batch'],
            'pack_size' => 1,
            'new_cost_price' => 10,
            'sale_price' => 15,
            'unit_cost_price' => 10,
            'unit_sales_price' => 15,
            'unit_stock' => 1,
        ]);

        MasterTransaction::query()->create([
            'product_id' => $product->id,
            'transaction_type' => MasterTransactionType::In,
            'transactionable_type' => MasterTransactionSourceType::Grn,
            'transactionable_id' => $grn->id,
            'stock_type' => 'branch',
            'stock_type_id' => $branch->id,
            'quantity' => 10,
            'unit_price' => 10,
            'status' => MasterTransactionStatus::Completed->value,
            'batch_no' => $batch['batch'],
            'created_by' => $user->id,
        ]);
    }

    actingAs($user);

    foreach ($batches as $batch) {
        $response = get(route('stock-in-hand.index', [
            'expiry_status' => $batch['filter'],
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('stock-in-hand/index')
            ->has('stockRows.data', 1)
            ->where('stockRows.data.0.expiry_status', $batch['filter'])
            ->where('stockRows.data.0.expiry_date', $batch['expiry'])
        );
    }
});

test('stock bin card resolves main search to a matching product', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $product = Product::query()->create([
        'name' => 'Vitamin C Tablets',
        'sku' => 'VC-001',
        'price' => 50,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.stock-bin-card', [
        'search' => 'Vitamin C',
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/bin-card/index')
        ->where('selectedProduct.id', $product->id)
        ->where('filters.product_id', $product->id)
        ->where('searchProductNotFound', false)
    );
});

test('stock bin card search reports not found when no product matches', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    Product::query()->create([
        'name' => 'Other Item',
        'sku' => 'OTH-1',
        'price' => 50,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.stock-bin-card', [
        'search' => 'NonexistentProductName12345',
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/bin-card/index')
        ->where('selectedProduct', null)
        ->where('searchProductNotFound', true)
    );
});

test('stock bin card shows quantities and prices in base units using product pack size', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $product = Product::query()->create([
        'name' => 'Packaged Item',
        'sku' => 'PACK-001',
        'price' => 75,
        'pack_size' => 10,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 2,
        'unit_price' => 100,
        'batch_no' => 'BATCH-PACK',
        'status' => MasterTransactionStatus::Completed->value,
        'created_by' => $user->id,
        'transaction_date' => now()->subDay(),
    ]);

    actingAs($user);

    $response = get(route('inventory.stock-bin-card', [
        'product_id' => $product->id,
        'date_from' => now()->subWeek()->format('Y-m-d'),
        'date_to' => now()->addWeek()->format('Y-m-d'),
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/bin-card/index')
        ->where('openingBalance', 0)
        ->where('currentStock', 20)
        ->has('transactions.data', 1)
        ->where('transactions.data.0.quantity_units', 20)
        ->where('transactions.data.0.unit_price_per_unit', 10)
    );
});

test('authorized users can view stock bin card from inventory menu', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $product = Product::query()->create([
        'name' => 'Bin Card Product',
        'sku' => 'BIN-TEST-001',
        'price' => 75,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 12,
        'unit_price' => 15,
        'batch_no' => 'BATCH-001',
        'status' => MasterTransactionStatus::Completed->value,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.stock-bin-card'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/bin-card/index')
        ->has('products', 1)
    );
});
