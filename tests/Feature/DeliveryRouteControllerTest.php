<?php

use App\Models\DeliveryRoute;
use App\Models\User;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

test('guests are redirected from delivery routes routes', function () {
    get(route('delivery-routes.index'))->assertRedirect('/login');
    get(route('delivery-routes.create'))->assertRedirect('/login');
    post(route('delivery-routes.store'))->assertRedirect('/login');
    get(route('delivery-routes.show', 1))->assertRedirect('/login');
    get(route('delivery-routes.edit', 1))->assertRedirect('/login');
    put(route('delivery-routes.update', 1))->assertRedirect('/login');
    delete(route('delivery-routes.destroy', 1))->assertRedirect('/login');
});

test('authorized users can view delivery routes index page', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-delivery-routes', 'web');
    Permission::findOrCreate('view-delivery-routes', 'web');
    $user->givePermissionTo(['manage-delivery-routes', 'view-delivery-routes']);

    DeliveryRoute::factory()->create(['created_by' => $user->id]);

    actingAs($user);

    $response = get(route('delivery-routes.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('DeliveryRoutes/Index')
        ->has('deliveryRoutes.data', 1)
    );
});

test('authorized users can create delivery route', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-delivery-routes', 'web');
    Permission::findOrCreate('create-delivery-routes', 'web');
    $user->givePermissionTo(['manage-delivery-routes', 'create-delivery-routes']);

    actingAs($user);

    $response = post(route('delivery-routes.store'), [
        'routename' => 'Test Route',
        'routecode' => 'TR001',
        'description' => 'Test description',
    ]);

    $response->assertRedirect(route('delivery-routes.index'));
    expect(DeliveryRoute::where('routecode', 'TR001')->exists())->toBeTrue();
});

test('authorized users can view delivery route', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-delivery-routes', 'web');
    Permission::findOrCreate('view-delivery-routes', 'web');
    $user->givePermissionTo(['manage-delivery-routes', 'view-delivery-routes']);

    $deliveryRoute = DeliveryRoute::factory()->create(['created_by' => $user->id]);

    actingAs($user);

    $response = get(route('delivery-routes.show', $deliveryRoute));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('DeliveryRoutes/Show')
        ->has('deliveryRoute')
    );
});

test('authorized users can update delivery route', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-delivery-routes', 'web');
    Permission::findOrCreate('edit-delivery-routes', 'web');
    $user->givePermissionTo(['manage-delivery-routes', 'edit-delivery-routes']);

    $deliveryRoute = DeliveryRoute::factory()->create(['created_by' => $user->id]);

    actingAs($user);

    $response = put(route('delivery-routes.update', $deliveryRoute), [
        'routename' => 'Updated Route',
        'routecode' => 'UR001',
        'description' => 'Updated description',
    ]);

    $response->assertRedirect(route('delivery-routes.show', $deliveryRoute));
    $deliveryRoute->refresh();
    expect($deliveryRoute->routename)->toBe('Updated Route');
});

test('authorized users can delete delivery route', function () {
    /** @var User $user */
    $user = User::factory()->createOne(['type' => 'superadmin']);

    Permission::findOrCreate('manage-delivery-routes', 'web');
    Permission::findOrCreate('delete-delivery-routes', 'web');
    $user->givePermissionTo(['manage-delivery-routes', 'delete-delivery-routes']);

    $deliveryRoute = DeliveryRoute::factory()->create(['created_by' => $user->id]);

    actingAs($user);

    $response = delete(route('delivery-routes.destroy', $deliveryRoute));

    $response->assertOk();
    expect(DeliveryRoute::find($deliveryRoute->id))->toBeNull();
});
