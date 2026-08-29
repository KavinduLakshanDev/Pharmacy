<?php

use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Grn;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierReturn;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function withoutSupplierLedgerCardGuards($test)
{
    return $test->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        CheckPlanAccess::class,
        HandleInertiaRequests::class,
    ]);
}

it('shows supplier payments as debits and supplier returns as credits', function () {
    $user = User::factory()->create(['type' => 'company']);
    Permission::query()->create(['name' => 'view-supplier-ledger-card', 'guard_name' => 'web']);
    $user->givePermissionTo('view-supplier-ledger-card');

    $supplier = Supplier::factory()->create();

    Grn::query()->create([
        'grn_no' => 'GRN-001',
        'invoice_no' => 'INV-001',
        'sup_id' => $supplier->id,
        'created_by' => $user->id,
        'grn_date' => '2026-05-01',
        'total_amount' => 1000,
        'paid_amount' => 0,
    ]);

    SupplierPayment::query()->create([
        'supplier_id' => $supplier->id,
        'payment_method' => 'cash',
        'paid_amount' => 300,
        'payment_date' => '2026-05-02',
        'created_by' => $user->id,
    ]);

    SupplierReturn::query()->create([
        'return_number' => 'SR-001',
        'supplier_id' => $supplier->id,
        'grn_id' => Grn::query()->where('grn_no', 'GRN-001')->value('id'),
        'return_date' => '2026-05-03',
        'notes' => 'Damaged goods',
        'sub_total' => 200,
        'total_amount' => 200,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user);
    $this->withoutVite();

    $response = withoutSupplierLedgerCardGuards($this)->get(route('reports.supplier-ledger-card', [
        'date_from' => '2026-05-01',
        'date_to' => '2026-05-31',
        'supplier_id' => $supplier->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page
        ->component('reports/supplier-ledger-card')
        ->where('summary.opening_balance', 0)
        ->where('summary.total_debits', 1300)
        ->where('summary.total_credits', 200)
        ->where('summary.closing_balance', 1100)
        ->has('ledgerEntries', 3)
        ->where('ledgerEntries.0.reference', 'GRN-001')
        ->where('ledgerEntries.0.debit', 1000)
        ->where('ledgerEntries.0.credit', 0)
        ->where('ledgerEntries.0.balance', 1000)
        ->where('ledgerEntries.1.description', 'Supplier Payment - cash')
        ->where('ledgerEntries.1.debit', 300)
        ->where('ledgerEntries.1.credit', 0)
        ->where('ledgerEntries.1.balance', 1300)
        ->where('ledgerEntries.2.reference', 'SR-001')
        ->where('ledgerEntries.2.description', 'Supplier Return (Damaged goods)')
        ->where('ledgerEntries.2.debit', 0)
        ->where('ledgerEntries.2.credit', 200)
        ->where('ledgerEntries.2.balance', 1100)
    );
});
