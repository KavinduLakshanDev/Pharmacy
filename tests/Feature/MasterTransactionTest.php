<?php

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionType;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Validation\ValidationException;

test('it calculates totals and stock movement with generated references', function () {
    $user = User::factory()->create();
    $product = Product::query()->create([
        'name' => 'Chicken',
        'sku' => 'CHK-001',
        'description' => 'Inventory tracked chicken item',
        'price' => 25,
        'stock_quantity' => 0,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $grnTransaction = MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 50,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    expect($grnTransaction->previous_stock)->toBe(0)
        ->and($grnTransaction->current_stock)->toBe(50)
        ->and((float) $grnTransaction->total_amount)->toBe(500.0)
        ->and($grnTransaction->reference_number)->toStartWith('GRN-');

    $usageTransaction = MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::Out,
        'transactionable_type' => MasterTransactionSourceType::UsageNote,
        'quantity' => 10,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    expect($usageTransaction->previous_stock)->toBe(50)
        ->and($usageTransaction->current_stock)->toBe(40)
        ->and((float) $usageTransaction->total_amount)->toBe(100.0)
        ->and($usageTransaction->reference_number)->toStartWith('USG-')
        ->and((int) $product->fresh()->stock_quantity)->toBe(40);
});

test('it updates global stock even when transactions have a stock scope', function () {
    $user = User::factory()->create();
    $product = Product::query()->create([
        'name' => 'Chicken',
        'sku' => 'CHK-004',
        'description' => 'Inventory tracked chicken item',
        'price' => 25,
        'stock_quantity' => 0,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 10,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'stock_type' => 'branch',
        'stock_type_id' => 1,
        'quantity' => 5,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    expect((int) $product->fresh()->stock_quantity)->toBe(15);
});

test('it does not allow stock to go below zero', function () {
    $user = User::factory()->create();
    $product = Product::query()->create([
        'name' => 'Chicken',
        'sku' => 'CHK-002',
        'description' => 'Inventory tracked chicken item',
        'price' => 25,
        'stock_quantity' => 0,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 5,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    expect(fn () => MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::Out,
        'transactionable_type' => MasterTransactionSourceType::UsageNote,
        'quantity' => 6,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]))->toThrow(ValidationException::class);
});

test('it supports soft deletes', function () {
    $user = User::factory()->create();
    $product = Product::query()->create([
        'name' => 'Chicken',
        'sku' => 'CHK-003',
        'description' => 'Inventory tracked chicken item',
        'price' => 25,
        'stock_quantity' => 0,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $transaction = MasterTransaction::query()->create([
        'product_id' => $product->id,
        'transaction_type' => MasterTransactionType::In,
        'transactionable_type' => MasterTransactionSourceType::Grn,
        'quantity' => 10,
        'unit_price' => 10,
        'created_by' => $user->id,
    ]);

    $transaction->delete();

    expect($transaction->fresh()?->deleted_at)->not->toBeNull();
});
