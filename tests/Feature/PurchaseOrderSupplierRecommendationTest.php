<?php

use App\Enums\GrnStatus;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Models\Permission;

it('recommends the lower cost supplier even when another supplier is faster', function () {
    $user = User::factory()->create([
        'type' => 'superadmin',
        'email_verified_at' => now(),
    ]);
    Permission::findOrCreate('manage-purchase-orders', 'web');
    $user->givePermissionTo('manage-purchase-orders');

    $product = Product::query()->forceCreate([
        'name' => 'Amoxicillin 500mg',
        'sku' => 'AMOX-500',
        'price' => 0,
        'stock_quantity' => 0,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $supplierCheaper = Supplier::factory()->create([
        'company_name' => 'Alpha Pharma',
    ]);

    $supplierFaster = Supplier::factory()->create([
        'company_name' => 'Beta Pharma',
    ]);

    $slowPurchaseOrder = PurchaseOrder::query()->forceCreate([
        'name' => 'Alpha PO',
        'order_date' => '2026-04-01',
        'status' => 'confirmed',
        'supplier_id' => $supplierCheaper->id,
        'created_by' => $user->id,
    ]);

    $slowPurchaseOrder->products()->sync([
        $product->id => [
            'quantity' => 10,
            'unit_price' => 10,
            'total_price' => 100,
            'discount_type' => 'none',
            'discount_value' => 0,
            'discount_amount' => 0,
        ],
    ]);

    $alphaGrn = Grn::query()->forceCreate([
        'grn_no' => 'GRN-ALPHA-001',
        'sup_id' => $supplierCheaper->id,
        'grn_date' => '2026-04-10',
        'status' => GrnStatus::Approved->value,
        'sub_total' => 100,
        'discount_amount' => 0,
        'total_amount' => 100,
        'paid_amount' => 0,
        'created_by' => $user->id,
    ]);

    GrnItem::query()->forceCreate([
        'grn_id' => $alphaGrn->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'unit_price' => 10,
        'total_price' => 100,
        'new_cost_price' => 10,
        'unit_cost_price' => 10,
    ]);

    $fastPurchaseOrder = PurchaseOrder::query()->forceCreate([
        'name' => 'Beta PO',
        'order_date' => '2026-04-01',
        'status' => 'confirmed',
        'supplier_id' => $supplierFaster->id,
        'created_by' => $user->id,
    ]);

    $fastPurchaseOrder->products()->sync([
        $product->id => [
            'quantity' => 10,
            'unit_price' => 15,
            'total_price' => 150,
            'discount_type' => 'none',
            'discount_value' => 0,
            'discount_amount' => 0,
        ],
    ]);

    $betaGrn = Grn::query()->forceCreate([
        'grn_no' => 'GRN-BETA-001',
        'sup_id' => $supplierFaster->id,
        'grn_date' => '2026-04-03',
        'status' => GrnStatus::Approved->value,
        'sub_total' => 150,
        'discount_amount' => 0,
        'total_amount' => 150,
        'paid_amount' => 0,
        'created_by' => $user->id,
    ]);

    GrnItem::query()->forceCreate([
        'grn_id' => $betaGrn->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'unit_price' => 15,
        'total_price' => 150,
        'new_cost_price' => 15,
        'unit_cost_price' => 15,
    ]);

    $this->actingAs($user);
    $response = $this->withoutMiddleware(PermissionMiddleware::class)->get(route('purchase-orders.recommend-suppliers', [
        'product_ids' => [$product->id],
    ]));

    $response->assertOk();
    $response->assertJsonPath('recommendations.0.supplier_name', 'Alpha Pharma');
    $response->assertJsonPath('recommendations.0.cost_score', 100);
    $response->assertJsonPath('recommendations.0.delivery_score', 0);
    $response->assertJsonPath('recommendations.1.supplier_name', 'Beta Pharma');
});
