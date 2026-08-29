<?php

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

it('can create a purchase order with supplier and multiple line items', function () {
    $user = User::factory()->create();
    $supplier = Supplier::factory()->create();

    $productA = Product::factory()->create(['price' => 50]);
    $productB = Product::factory()->create(['price' => 30]);

    $purchaseOrder = PurchaseOrder::create([
        'name' => 'Test Purchase Order',
        'order_date' => now()->toDateString(),
        'status' => 'draft',
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $purchaseOrder->products()->sync([
        $productA->id => [
            'quantity' => 2,
            'unit_price' => 50,
            'total_price' => 100,
            'discount_type' => 'none',
            'discount_value' => 0,
            'discount_amount' => 0,
        ],
        $productB->id => [
            'quantity' => 3,
            'unit_price' => 30,
            'total_price' => 90,
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'discount_amount' => 9,
        ],
    ]);

    $purchaseOrder->refresh();

    expect($purchaseOrder->supplier)->not->toBeNull();
    expect($purchaseOrder->supplier->id)->toBe($supplier->id);
    expect($purchaseOrder->products)->toHaveCount(2);
    expect($purchaseOrder->products()->sum('purchase_order_products.quantity'))->toBe(5);

    $purchaseOrder->calculateTotals();

    expect($purchaseOrder->subtotal)->toBe('181.00');
    expect($purchaseOrder->discount_amount)->toBe('9.00');
    expect($purchaseOrder->total_amount)->toBe('181.00');
});

it('authorized users can create purchase order and see it on the index page', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-purchase-orders', 'web');
    Permission::findOrCreate('create-purchase-orders', 'web');
    Permission::findOrCreate('view-purchase-orders', 'web');
    $user->givePermissionTo(['manage-purchase-orders', 'create-purchase-orders', 'view-purchase-orders']);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    actingAs($user);
    $this->withoutMiddleware(Spatie\Permission\Middleware\PermissionMiddleware::class);

    get(route('purchase-orders.index'))->assertOk();

    $supplier = Supplier::factory()->create();
    $product = Product::factory()->create(['price' => 10]);

    $response = post(route('purchase-orders.store'), [
        'name' => 'Purchase Order Test',
        'order_date' => now()->toDateString(),
        'status' => 'draft',
        'supplier_id' => $supplier->id,
        'products' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 10,
                'discount_type' => 'none',
                'discount_value' => 0,
            ],
        ],
    ]);

    $response->assertRedirect(route('purchase-orders.index'));
    expect(PurchaseOrder::where('name', 'Purchase Order Test')->exists())->toBeTrue();

    $indexResponse = get(route('purchase-orders.index'));
    $indexResponse->assertOk();
    $indexResponse->assertInertia(fn ($page) => $page
        ->component('purchase-orders/index')
        ->has('purchaseOrders.data', 1)
    );
});
