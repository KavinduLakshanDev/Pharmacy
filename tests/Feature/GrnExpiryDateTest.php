<?php

use App\Enums\GrnStatus;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;

it('stores calculated expiry date on grn items when none is provided', function () {
    $user = User::factory()->create();

    $branch = Branch::create([
        'created_by' => $user->id,
        'name' => 'Test Branch',
    ]);

    $supplier = Supplier::create([
        'company_name' => 'Test Supplier',
    ]);

    $product = Product::factory()->create([
        'expire_date' => 30,
    ]);

    $grnDate = '2026-03-01';

    $this->actingAs($user)
        ->post(route('grns.store'), [
            'grn_no' => 'GRN-TEST',
            'batch_no' => 'BN-TEST',
            'invoice_no' => 'INV-1',
            'sup_id' => $supplier->id,
            'branch_id' => $branch->id,
            'grn_date' => $grnDate,
            'description' => 'Test GRN',
            'status' => GrnStatus::Pending->value,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_price' => 10,
                    'discount_type' => 'none',
                    'discount_value' => 0,
                ],
            ],
        ]);

    $this->assertDatabaseHas('grn_items', [
        'product_id' => $product->id,
        'expiry_date' => '2026-03-31 00:00:00',
    ]);
});
