<?php

use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\DrugForm;
use App\Models\GenericName;
use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Middleware\PermissionMiddleware;

function withoutProductGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
        PermissionMiddleware::class,
    ]);
}

it('renders the product index page with the generic name relation', function () {
    $user = User::factory()->create([
        'type' => 'company',
        'created_by' => 0,
    ]);

    $this->actingAs($user);

    $genericName = GenericName::create([
        'name' => 'Paracetamol',
        'created_by' => $user->id,
        'status' => 'active',
    ]);

    Product::factory()->create([
        'generic_name_id' => $genericName->id,
        'created_by' => $user->id,
    ]);

    $response = withoutProductGuards($this)->get(route('products.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('products/index')
        ->has('products.data', 1)
        ->where('products.data.0.generic_name.name', 'Paracetamol')
    );
});

it('filters products by generic name and drug form', function () {
    $user = User::factory()->create([
        'type' => 'company',
        'created_by' => 0,
    ]);

    $this->actingAs($user);

    $genericName = GenericName::create([
        'name' => 'Ibuprofen',
        'created_by' => $user->id,
        'status' => 'active',
    ]);

    $drugForm = DrugForm::create([
        'name' => 'Tablet',
        'created_by' => $user->id,
        'status' => 'active',
    ]);

    Product::factory()->create([
        'generic_name_id' => $genericName->id,
        'drug_form_id' => $drugForm->id,
        'created_by' => $user->id,
    ]);

    Product::factory()->create([
        'created_by' => $user->id,
    ]);

    $response = withoutProductGuards($this)->get(route('products.index', [
        'generic_name' => $genericName->id,
        'drug_form' => $drugForm->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('products/index')
        ->has('products.data', 1)
        ->where('filters.generic_name', (string) $genericName->id)
        ->where('filters.drug_form', (string) $drugForm->id)
        ->where('products.data.0.generic_name.name', 'Ibuprofen')
        ->where('products.data.0.drug_form.name', 'Tablet')
    );
});

it('stores drug strength when creating a product', function () {
    $user = User::factory()->create([
        'type' => 'company',
        'created_by' => 0,
    ]);

    $this->actingAs($user);

    $genericName = GenericName::create([
        'name' => 'Amoxicillin',
        'created_by' => $user->id,
        'status' => 'active',
    ]);

    $drugForm = DrugForm::create([
        'name' => 'Capsule',
        'created_by' => $user->id,
        'status' => 'active',
    ]);

    $response = withoutProductGuards($this)->post(route('products.store'), [
        'name' => 'Test Product',
        'sku' => 'TP-001',
        'barcode' => null,
        'description' => null,
        'price' => 100,
        'stock_quantity' => 0,
        'main_image_id' => null,
        'additional_image_ids' => null,
        'category_id' => null,
        'generic_name_id' => $genericName->id,
        'drug_form_id' => $drugForm->id,
        'drug_strength' => '500mg',
        'tax_id' => null,
        'unit_id' => null,
        'reorder_level' => 0,
        'expire_date' => null,
        'pack_size' => null,
        'profit_margin' => null,
        'status' => 'active',
        'assigned_to' => null,
        'details_prices' => [],
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseHas('products', [
        'sku' => 'TP-001',
        'drug_strength' => '500mg',
    ]);
});
