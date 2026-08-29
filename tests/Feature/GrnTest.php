<?php

use App\Enums\GrnStatus;
use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionStatus;
use App\Models\Branch;
use App\Models\Grn;
use App\Models\MasterTransaction;

it('can create a grn with items and has correct relationships', function () {
    $grn = Grn::factory()->has(\App\Models\GrnItem::factory()->count(2), 'items')->create();

    expect($grn->items)->toHaveCount(2);
    expect($grn->supplier)->not->toBeNull();
    expect(GrnStatus::values())->toContain($grn->status->value);
    expect($grn->creator)->not->toBeNull();
});

it('creates master transactions for grns and uses head office branch stock', function () {
    $grn = Grn::factory()
        ->has(\App\Models\GrnItem::factory()->count(2), 'items')
        ->create(['status' => GrnStatus::Pending->value]);

    // Ensure the expected head office branch exists for this company.
    $headOffice = Branch::firstOrCreate([
        'created_by' => $grn->created_by,
        'name' => 'Head Office',
    ], [
        'address' => 'No. 100, Main Street',
        'phone' => '+000 000 0000',
        'email' => "headoffice-{$grn->created_by}@example.com",
        'status' => 'active',
    ]);

    // Trigger totals recalculation (this also syncs master transactions).
    $grn->calculateTotals();

    $transactions = MasterTransaction::query()
        ->where('transactionable_type', MasterTransactionSourceType::Grn)
        ->where('transactionable_id', $grn->id)
        ->get();

    expect($transactions)->toHaveCount(2);
    expect($transactions->first()->stock_type)->toBe(MasterTransactionStockType::Branch);
    expect($transactions->first()->stock_type_id)->toBe($grn->branch_id);
    expect($transactions->first()->status)->toBe(MasterTransactionStatus::Pending);
    expect($transactions->first()->reference_number)->toStartWith($grn->grn_no);
});

it('generates grn and batch numbers in the GRNmmdd1 and BNmmdd1 format', function () {
    $user = App\Models\User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('grns.next-number', ['date' => '2026-05-07']))
        ->assertOk()
        ->assertJson([
            'grn_no' => 'GRN05071',
            'batch_no' => 'BN05071',
        ]);
});
