<?php

use App\Enums\MasterTransactionType;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\MasterTransactionSeeder;

use function Pest\Laravel\seed;

test('master transaction seeder creates in and out transactions for available products', function () {
    $companyUser = User::factory()->create([
        'type' => 'company',
    ]);

    $firstProduct = Product::query()->create([
        'name' => 'Seeded Product A',
        'sku' => 'SEED-PROD-001',
        'price' => 100,
        'stock_quantity' => 20,
        'status' => 'active',
        'created_by' => $companyUser->id,
    ]);

    $secondProduct = Product::query()->create([
        'name' => 'Seeded Product B',
        'sku' => 'SEED-PROD-002',
        'price' => 50,
        'stock_quantity' => 8,
        'status' => 'active',
        'created_by' => $companyUser->id,
    ]);

    seed(MasterTransactionSeeder::class);

    $firstProductTransactions = MasterTransaction::query()->where('product_id', $firstProduct->id)->orderBy('id')->get();
    $secondProductTransactions = MasterTransaction::query()->where('product_id', $secondProduct->id)->orderBy('id')->get();

    expect($firstProductTransactions)->toHaveCount(2)
        ->and($secondProductTransactions)->toHaveCount(2)
        ->and($firstProductTransactions[0]->transaction_type)->toBe(MasterTransactionType::In)
        ->and($firstProductTransactions[1]->transaction_type)->toBe(MasterTransactionType::Out)
        ->and($secondProductTransactions[0]->transaction_type)->toBe(MasterTransactionType::In)
        ->and($secondProductTransactions[1]->transaction_type)->toBe(MasterTransactionType::Out)
        ->and((int) $firstProduct->fresh()->stock_quantity)->toBe(20)
        ->and((int) $secondProduct->fresh()->stock_quantity)->toBe(8);
});

test('master transaction seeder is idempotent', function () {
    $companyUser = User::factory()->create([
        'type' => 'company',
    ]);

    Product::query()->create([
        'name' => 'Seeded Product C',
        'sku' => 'SEED-PROD-003',
        'price' => 75,
        'stock_quantity' => 12,
        'status' => 'active',
        'created_by' => $companyUser->id,
    ]);

    seed(MasterTransactionSeeder::class);
    seed(MasterTransactionSeeder::class);

    expect(MasterTransaction::query()->count())->toBe(2);
});
