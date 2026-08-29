<?php

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\StockTransferStatus;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\User;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

test('stock transfer accepts decimal quantity and posts exact quantity to branch ledgers', function () {
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    $user->givePermissionTo('manage-inventory');

    $fromBranch = Branch::query()->create(['name' => 'Branch A', 'created_by' => $user->id]);
    $toBranch = Branch::query()->create(['name' => 'Branch B', 'created_by' => $user->id]);

    $product = Product::query()->create([
        'name' => 'Tablet Product',
        'sku' => 'TAB-001',
        'price' => 100,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'transactionable_id' => 1,
        'stock_type' => MasterTransactionStockType::Branch,
        'stock_type_id' => $fromBranch->id,
        'batch_no' => 'BATCH-01',
        'quantity' => 10,
        'unit_price' => 100,
        'status' => MasterTransactionStatus::Completed,
        'created_by' => $user->id,
    ]);

    $sourceGrn = Grn::factory()->create([
        'branch_id' => $fromBranch->id,
        'created_by' => $user->id,
    ]);

    GrnItem::factory()->create([
        'grn_id' => $sourceGrn->id,
        'product_id' => $product->id,
        'batch_no' => 'BATCH-01',
        'pack_size' => 1,
        'new_cost_price' => 100,
        'unit_stock' => 100_000,
    ]);

    actingAs($user);

    $response = post(route('inventory.stock-transfers.store'), [
        'transfer_no' => 'ST-900001',
        'from_branch_id' => $fromBranch->id,
        'to_branch_id' => $toBranch->id,
        'transfer_date' => now()->toDateString(),
        'status' => StockTransferStatus::Approved->value,
        'notes' => 'Tablet wise transfer',
        'items' => [[
            'product_id' => $product->id,
            'batch_no' => 'BATCH-01',
            'quantity' => 1.5,
            'unit_price' => 100,
            'unit_cost_price' => 10,
        ]],
    ]);

    $response->assertRedirect(route('inventory.stock-transfers.index'));

    $transfer = StockTransfer::query()->where('transfer_no', 'ST-900001')->firstOrFail();
    expect($transfer->status->value)->toBe(StockTransferStatus::Approved->value);

    $transfer->accept($user->id);

    expect($transfer->fresh()->status->value)->toBe(StockTransferStatus::Accepted->value);

    $item = $transfer->items()->firstOrFail();
    expect((float) $item->quantity)->toBe(1.5);

    $outTransaction = MasterTransaction::query()
        ->where('transactionable_type', MasterTransactionSourceType::StockTransfer->value)
        ->where('transactionable_id', $transfer->id)
        ->where('transaction_type', MasterTransactionType::Out->value)
        ->where('stock_type_id', $fromBranch->id)
        ->firstOrFail();

    $inTransaction = MasterTransaction::query()
        ->where('transactionable_type', MasterTransactionSourceType::StockTransfer->value)
        ->where('transactionable_id', $transfer->id)
        ->where('transaction_type', MasterTransactionType::In->value)
        ->where('stock_type_id', $toBranch->id)
        ->firstOrFail();

    expect((float) $outTransaction->quantity)->toBe(1.5);
    expect((float) $inTransaction->quantity)->toBe(1.5);
});
