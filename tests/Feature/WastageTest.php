<?php

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\WastageStatus;
use App\Models\Branch;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\User;
use App\Models\Wastage;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

test('guests are redirected from inventory wastages route', function () {
    $response = get(route('inventory.wastages.index'));

    $response->assertRedirect('/login');
});

test('authorized users can view wastage create page', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    $user->givePermissionTo('manage-inventory');

    actingAs($user);

    $response = get(route('inventory.wastages.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('inventory/wastages/create'));
});

test('wastage create page includes branch stock balances for available items', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    $user->givePermissionTo('manage-inventory');

    $branch = Branch::query()->create(['name' => 'Main Branch', 'created_by' => $user->id]);
    $product = Product::query()->create([
        'name' => 'Available Product',
        'sku' => 'AVAIL-001',
        'price' => 25,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'stock_type' => MasterTransactionStockType::Branch,
        'stock_type_id' => $branch->id,
        'quantity' => 7,
        'unit_price' => 25,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.wastages.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/wastages/create')
        ->where('branchStock.'.$branch->id.'.'.$product->id, 7)
    );
});

test('wastage create creates a batch-specific out transaction', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    $user->givePermissionTo('manage-inventory');

    $branch = Branch::query()->create(['name' => 'Main Branch', 'created_by' => $user->id]);
    $product = Product::query()->create([
        'name' => 'Batch Product',
        'sku' => 'BATCH-001',
        'price' => 100,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'stock_type' => MasterTransactionStockType::Branch,
        'stock_type_id' => $branch->id,
        'batch_no' => 'BATCH-2026-01',
        'quantity' => 10,
        'unit_price' => 100,
        'status' => MasterTransactionStatus::Completed,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = post(route('inventory.wastages.store'), [
        'wastage_no' => 'WST-000002',
        'branch_id' => $branch->id,
        'wastage_date' => now()->toDateString(),
        'notes' => 'Batch wastage',
        'items' => [
            [
                'product_id' => $product->id,
                'batch_no' => 'BATCH-2026-01',
                'quantity' => 2,
                'unit_price' => 100,
            ],
        ],
    ]);

    $response->assertRedirect(route('inventory.wastages.index'));

    $wastage = Wastage::query()->where('wastage_no', 'WST-000002')->firstOrFail();

    expect($wastage->status->value)->toBe(WastageStatus::Approved->value);
    expect($wastage->items()->first()->batch_no)->toBe('BATCH-2026-01');
    expect(MasterTransaction::query()
        ->where('transactionable_type', MasterTransactionSourceType::Wastage->value)
        ->where('transactionable_id', $wastage->id)
        ->where('batch_no', 'BATCH-2026-01')
        ->where('transaction_type', MasterTransactionType::Out->value)
        ->exists())->toBeTrue();
});

test('authorized users can create a wastage record and it creates a stock transaction', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    $user->givePermissionTo('manage-inventory');

    $branch = Branch::query()->create(['name' => 'Main Branch', 'created_by' => $user->id]);
    $product = Product::query()->create([
        'name' => 'Wastage Product',
        'sku' => 'WAST-001',
        'price' => 40,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'stock_type' => MasterTransactionStockType::Branch,
        'stock_type_id' => $branch->id,
        'quantity' => 10,
        'unit_price' => 40,
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = post(route('inventory.wastages.store'), [
        'wastage_no' => 'WST-000001',
        'branch_id' => $branch->id,
        'wastage_date' => now()->toDateString(),
        'status' => WastageStatus::Approved->value,
        'notes' => 'Damaged stock',
        'items' => [
            [
                'product_id' => $product->id,
                'batch_no' => 'DEFAULT-BATCH',
                'quantity' => 2,
                'unit_price' => 40,
            ],
        ],
    ]);

    $response->assertRedirect(route('inventory.wastages.index'));

    $wastage = Wastage::query()->where('wastage_no', 'WST-000001')->first();
    expect($wastage)->not()->toBeNull();
    expect($wastage->status->value)->toBe(WastageStatus::Approved->value);

    $transaction = MasterTransaction::query()->where('transactionable_type', MasterTransactionSourceType::Wastage)->where('transactionable_id', $wastage->id)->first();
    expect($transaction)->not()->toBeNull();
    expect($transaction->transaction_type)->toBe(MasterTransactionType::Out);
    expect((int) $transaction->quantity)->toBe(2);
});
