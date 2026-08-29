<?php

use App\Models\Product;
use App\Models\User;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

test('guests are redirected from inventory product lookup route', function () {
    $response = get(route('inventory.product-lookup'));

    $response->assertRedirect('/login');
});

test('authorized users can view inventory product lookup page', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    Product::query()->create([
        'name' => 'Lookup Product',
        'sku' => 'LOOKUP-001',
        'price' => 100,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.product-lookup'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/product-lookup')
        ->where('products.0.name', 'Lookup Product')
    );
});

test('inventory product lookup page filters products by search term', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    Product::query()->create([
        'name' => 'Filtered Item',
        'sku' => 'FILTER-001',
        'price' => 55,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    Product::query()->create([
        'name' => 'Other Item',
        'sku' => 'OTHER-001',
        'price' => 30,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.product-lookup', ['search' => 'Filtered']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/product-lookup')
        ->where('products.0.name', 'Filtered Item')
    );
});

test('authorized users can view product lookup show page', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-inventory', 'web');
    Permission::findOrCreate('view-inventory-transactions', 'web');
    $user->givePermissionTo(['manage-inventory', 'view-inventory-transactions']);

    $product = Product::query()->create([
        'name' => 'Show Product',
        'sku' => 'SHOW-001',
        'price' => 80,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    actingAs($user);

    $response = get(route('inventory.product-lookup.show', $product->id));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/product-lookup-show')
        ->where('product.name', 'Show Product')
    );
});
