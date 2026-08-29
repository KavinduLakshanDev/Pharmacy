<?php

use App\Enums\VatRegistrationStatus;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Supplier;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;

function withoutSupplierGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('casts vat_registered to the VatRegistrationStatus enum and supports soft deletes', function () {
    $supplier = Supplier::factory()->create();

    expect($supplier->vat_registered)->toBeInstanceOf(VatRegistrationStatus::class);
    expect($supplier->deleted_at)->toBeNull();

    $supplier->delete();

    $trashed = Supplier::withTrashed()->find($supplier->id);

    expect($trashed)->not->toBeNull();
    expect($trashed->deleted_at)->not->toBeNull();
});

it('renders the supplier index page', function () {
    Supplier::factory()->count(2)->create();

    $response = withoutSupplierGuards($this)->get(route('suppliers.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('suppliers/index')
        ->has('suppliers.data', 2)
    );
});

it('filters suppliers by search and vat status on the index page', function () {
    Supplier::factory()->create([
        'company_name' => 'Alpha Supplies',
        'vat_registered' => VatRegistrationStatus::Registered,
    ]);

    Supplier::factory()->create([
        'company_name' => 'Beta Traders',
        'vat_registered' => VatRegistrationStatus::NotRegistered,
    ]);

    $response = withoutSupplierGuards($this)->get(route('suppliers.index', [
        'search' => 'Alpha',
        'vat_registered' => VatRegistrationStatus::Registered->value,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('suppliers/index')
        ->has('suppliers.data', 1)
        ->where('suppliers.data.0.company_name', 'Alpha Supplies')
        ->where('filters.search', 'Alpha')
        ->where('filters.vat_registered', VatRegistrationStatus::Registered->value)
    );
});

it('creates a supplier record', function () {
    $payload = [
        'company_name' => 'Acme Supply Ltd',
        'address' => null,
        'tel_no' => '0112223344',
        'mail' => 'acme@example.com',
        'website' => 'https://acme.example.com',
        'vat_registered' => VatRegistrationStatus::Registered->value,
        'vat_no' => '12345678',
        'contact_person_name' => 'John Doe',
        'contact_no' => '0770001122',
    ];

    $response = withoutSupplierGuards($this)->post(route('suppliers.store'), $payload);

    $response->assertRedirect(route('suppliers.index'));

    $this->assertDatabaseHas('suppliers', [
        'company_name' => 'Acme Supply Ltd',
        'vat_registered' => VatRegistrationStatus::Registered->value,
    ]);
});

it('updates an existing supplier', function () {
    $supplier = Supplier::factory()->create();

    $response = withoutSupplierGuards($this)->put(route('suppliers.update', $supplier), [
        'company_name' => 'Updated Supplier',
        'address' => null,
        'tel_no' => '0115556677',
        'mail' => 'updated@example.com',
        'website' => 'https://updated.example.com',
        'vat_registered' => VatRegistrationStatus::NotRegistered->value,
        'vat_no' => null,
        'contact_person_name' => 'Updated Contact',
        'contact_no' => '0771234567',
    ]);

    $response->assertRedirect(route('suppliers.index'));

    $this->assertDatabaseHas('suppliers', [
        'id' => $supplier->id,
        'company_name' => 'Updated Supplier',
        'vat_registered' => VatRegistrationStatus::NotRegistered->value,
    ]);
});

it('validates numeric supplier fields and max 10 digits for phone numbers', function () {
    $response = withoutSupplierGuards($this)->post(route('suppliers.store'), [
        'company_name' => 'Acme Supply Ltd',
        'address' => null,
        'tel_no' => '01122AB344',
        'mail' => 'acme@example.com',
        'website' => 'https://acme.example.com',
        'vat_registered' => VatRegistrationStatus::Registered->value,
        'vat_no' => 'VAT12345',
        'contact_person_name' => 'John Doe',
        'contact_no' => '07700011223',
    ]);

    $response->assertSessionHasErrors(['tel_no', 'contact_no']);
});

it('requires supplier email and contact number when creating a supplier', function () {
    $response = withoutSupplierGuards($this)->post(route('suppliers.store'), [
        'company_name' => 'Acme Supply Ltd',
        'address' => null,
        'tel_no' => '0112223344',
        'mail' => '',
        'website' => 'https://acme.example.com',
        'vat_registered' => VatRegistrationStatus::NotRegistered->value,
        'vat_no' => null,
        'contact_person_name' => 'John Doe',
        'contact_no' => '',
    ]);

    $response->assertSessionHasErrors(['mail', 'contact_no']);
});

it('soft deletes a supplier', function () {
    $supplier = Supplier::factory()->create();

    $response = withoutSupplierGuards($this)->delete(route('suppliers.destroy', $supplier));

    $response->assertRedirect(route('suppliers.index'));
    $this->assertSoftDeleted('suppliers', ['id' => $supplier->id]);
});
