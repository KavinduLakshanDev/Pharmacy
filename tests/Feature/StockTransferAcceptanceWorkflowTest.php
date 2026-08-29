<?php

use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\ProductType;
use App\Enums\StockTransferStatus;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('manage-inventory', 'web');

    $this->user = User::factory()->create(['type' => 'superadmin']);
    $this->user->givePermissionTo('manage-inventory');
    $this->sourceBranch = Branch::query()->create([
        'name' => 'Source Branch',
        'created_by' => $this->user->id,
    ]);
    $this->destBranch = Branch::query()->create([
        'name' => 'Dest Branch',
        'created_by' => $this->user->id,
    ]);
    $this->product = Product::query()->create([
        'name' => 'Transfer Product',
        'sku' => 'TRF-'.uniqid(),
        'product_type' => ProductType::FinishedProduct,
        'price' => 100,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    // Create initial stock in source branch
    MasterTransaction::factory()->create([
        'product_id' => $this->product->id,
        'transaction_type' => MasterTransactionType::In,
        'stock_type' => MasterTransactionStockType::Branch,
        'stock_type_id' => $this->sourceBranch->id,
        'quantity' => 100,
        'batch_no' => 'BATCH001',
        'status' => MasterTransactionStatus::Completed,
        'created_by' => $this->user->id,
    ]);

    // GRN line at source branch (cost + sellable unit_stock must align with sales / transfers)
    $sourceGrn = Grn::factory()->create([
        'branch_id' => $this->sourceBranch->id,
        'created_by' => $this->user->id,
    ]);

    GrnItem::factory()->create([
        'grn_id' => $sourceGrn->id,
        'product_id' => $this->product->id,
        'batch_no' => 'BATCH001',
        'pack_size' => 1,
        'new_cost_price' => 50.00,
        'unit_stock' => 100_000,
    ]);
});

test('stock transfer starts in pending status', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->count(1), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    expect($transfer->status)->toBe(StockTransferStatus::Pending);
    expect($transfer->approved_at)->toBeNull();
    expect($transfer->accepted_at)->toBeNull();
});

test('approve transfer changes status to approved and creates source out transaction', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->state([
            'product_id' => $this->product->id,
            'batch_no' => 'BATCH001',
            'quantity' => 10,
            'unit_price' => 100.00,
        ]), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    $transfer->approve($this->user->id);

    expect($transfer->refresh()->status)->toBe(StockTransferStatus::Approved);
    expect($transfer->approved_by)->toBe($this->user->id);
    expect($transfer->approved_at)->not->toBeNull();
    expect($transfer->masterTransactions()->count())->toBe(1);

    $outTransaction = $transfer->masterTransactions()
        ->where('transaction_type', MasterTransactionType::Out)
        ->first();

    expect($outTransaction)->not->toBeNull();
    expect($outTransaction->stock_type_id)->toBe($this->sourceBranch->id);
});

test('accept transfer creates master transactions', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->state([
            'product_id' => $this->product->id,
            'batch_no' => 'BATCH001',
            'quantity' => 10,
            'unit_price' => 100.00,
            'unit_cost_price' => 50.00,
        ]), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    $transfer->approve($this->user->id);
    $transfer->accept($this->user->id);

    expect($transfer->refresh()->status)->toBe(StockTransferStatus::Accepted);
    expect($transfer->accepted_by)->toBe($this->user->id);
    expect($transfer->accepted_at)->not->toBeNull();

    // Should have created OUT and IN transactions
    $transactions = $transfer->masterTransactions()->get();
    expect($transactions->count())->toBe(2);

    $outTransaction = $transactions->where('transaction_type', MasterTransactionType::Out)->first();
    $inTransaction = $transactions->where('transaction_type', MasterTransactionType::In)->first();

    expect($outTransaction)->not->toBeNull();
    expect($outTransaction->stock_type_id)->toBe($this->sourceBranch->id);
    expect((float) $outTransaction->quantity)->toBe(10.0);

    expect($inTransaction)->not->toBeNull();
    expect($inTransaction->stock_type_id)->toBe($this->destBranch->id);
    expect((float) $inTransaction->quantity)->toBe(10.0);
});

test('reject transfer changes status to rejected', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->state([
            'product_id' => $this->product->id,
            'batch_no' => 'BATCH001',
            'quantity' => 10,
            'unit_price' => 100.00,
        ]), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    $transfer->approve($this->user->id);
    $rejectionReason = 'Stock does not match our records';
    $transfer->reject($rejectionReason, $this->user->id);

    expect($transfer->refresh()->status)->toBe(StockTransferStatus::Rejected);
    expect($transfer->rejected_by)->toBe($this->user->id);
    expect($transfer->rejected_at)->not->toBeNull();
    expect($transfer->rejection_reason)->toBe($rejectionReason);
    expect($transfer->masterTransactions()->count())->toBe(0);
});

test('source branch can approve transfer', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('inventory.stock-transfers.approve', StockTransfer::factory()
        ->has(StockTransferItem::factory()->count(1), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ])->id));

    $response->assertRedirect();
});

test('cannot accept transfer that is not approved', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->count(1), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
            'status' => StockTransferStatus::Pending,
        ]);

    expect(fn () => $transfer->accept($this->user->id))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
});

test('cannot reject transfer that is not approved', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->count(1), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
            'status' => StockTransferStatus::Pending,
        ]);

    expect(fn () => $transfer->reject('Some reason', $this->user->id))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
});

test('stock is held at destination until accepted', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->state([
            'product_id' => $this->product->id,
            'batch_no' => 'BATCH001',
            'quantity' => 10,
            'unit_price' => 100.00,
        ]), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    // Get initial balances
    $sourceInitialBalance = MasterTransaction::query()
        ->where('product_id', $this->product->id)
        ->where('stock_type_id', $this->sourceBranch->id)
        ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
        ->value('balance');

    // After approve, balance should be reduced from source
    $transfer->approve($this->user->id);

    $sourceAfterApprove = MasterTransaction::query()
        ->where('product_id', $this->product->id)
        ->where('stock_type_id', $this->sourceBranch->id)
        ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
        ->value('balance');

    expect((float) $sourceAfterApprove)->toBe((float) $sourceInitialBalance - 10.0);

    // After accept, source balance should remain reduced, destination receives stock
    $transfer->accept($this->user->id);

    $sourceAfterAccept = MasterTransaction::query()
        ->where('product_id', $this->product->id)
        ->where('stock_type_id', $this->sourceBranch->id)
        ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
        ->value('balance');

    expect((float) $sourceAfterAccept)->toBe((float) $sourceAfterApprove);

    // Destination should have received the stock
    $destBalance = MasterTransaction::query()
        ->where('product_id', $this->product->id)
        ->where('stock_type_id', $this->destBranch->id)
        ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
        ->value('balance');

    expect((float) $destBalance)->toBe(10.0);
});

test('accept transfer updates grn unit_stock on destination batch line when present', function () {
    $this->actingAs($this->user);

    $destGrn = Grn::factory()->create([
        'branch_id' => $this->destBranch->id,
        'created_by' => $this->user->id,
    ]);

    $destLine = GrnItem::factory()->create([
        'grn_id' => $destGrn->id,
        'product_id' => $this->product->id,
        'batch_no' => 'BATCH001',
        'pack_size' => 1,
        'new_cost_price' => 50.00,
        'unit_stock' => 0,
    ]);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->state([
            'product_id' => $this->product->id,
            'batch_no' => 'BATCH001',
            'quantity' => 10,
            'unit_price' => 100.00,
        ]), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    $transfer->approve($this->user->id);
    $transfer->accept($this->user->id);

    expect((float) $destLine->fresh()->unit_stock)->toBe(10.0);
});

test('accept finalizes acceptance when ledger postings already exist matching line items', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->state([
            'product_id' => $this->product->id,
            'batch_no' => 'BATCH001',
            'quantity' => 10,
            'unit_price' => 100.00,
        ]), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    $transfer->approve($this->user->id);
    $transfer->accept($this->user->id);

    expect($transfer->fresh()->status)->toBe(StockTransferStatus::Accepted);

    // Stuck workflow: postings exist but status did not persist (recovery path)
    $transfer->fill([
        'status' => StockTransferStatus::Approved,
        'accepted_by' => null,
        'accepted_at' => null,
    ]);
    $transfer->save();

    expect($transfer->fresh()->masterTransactions()->count())->toBe(2);

    $transfer->accept($this->user->id);

    expect($transfer->fresh()->status)->toBe(StockTransferStatus::Accepted);
    expect($transfer->fresh()->accepted_by)->toBe($this->user->id);
    expect($transfer->fresh()->masterTransactions()->count())->toBe(2);
});

test('reject removes stray transfer ledger postings and restores branch ledger balances', function () {
    $this->actingAs($this->user);

    $transfer = StockTransfer::factory()
        ->has(StockTransferItem::factory()->state([
            'product_id' => $this->product->id,
            'batch_no' => 'BATCH001',
            'quantity' => 10,
            'unit_price' => 100.00,
        ]), 'items')
        ->create([
            'from_branch_id' => $this->sourceBranch->id,
            'to_branch_id' => $this->destBranch->id,
            'created_by' => $this->user->id,
        ]);

    $sourceBeforeApprove = MasterTransaction::query()
        ->where('product_id', $this->product->id)
        ->where('stock_type_id', $this->sourceBranch->id)
        ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
        ->value('balance');

    $transfer->approve($this->user->id);

    $transfer->accept($this->user->id);

    // Simulate stuck Approved + orphaned postings after stock already moved on the ledger.
    $transfer->fill([
        'status' => StockTransferStatus::Approved,
        'accepted_by' => null,
        'accepted_at' => null,
    ]);
    $transfer->save();

    expect($transfer->fresh()->masterTransactions()->count())->toBe(2);

    $transfer->reject('Cannot receive shipment', $this->user->id);

    expect($transfer->fresh()->status)->toBe(StockTransferStatus::Rejected);

    expect($transfer->fresh()->masterTransactions()->count())->toBe(0);

    $sourceAfterReject = MasterTransaction::query()
        ->where('product_id', $this->product->id)
        ->where('stock_type_id', $this->sourceBranch->id)
        ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
        ->value('balance');

    $destAfterReject = MasterTransaction::query()
        ->where('product_id', $this->product->id)
        ->where('stock_type_id', $this->destBranch->id)
        ->selectRaw('SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END) as balance', [MasterTransactionType::In->value])
        ->value('balance');

    expect((float) $sourceAfterReject)->toBe((float) $sourceBeforeApprove);
    expect((float) $destAfterReject)->toBe(0.0);
});
