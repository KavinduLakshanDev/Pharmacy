<?php

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\User;
use Database\Seeders\BranchSeeder;
use Database\Seeders\CashRegisterSeeder;

test('branch and cash register seeders create main and outlet branches with registers', function () {
    $companyUser = User::factory()->create([
        'type' => 'company',
    ]);

    User::factory()->create([
        'type' => 'staff',
    ]);

    $this->seed(BranchSeeder::class);
    $this->seed(CashRegisterSeeder::class);

    $branches = Branch::where('created_by', $companyUser->id)->get();
    $mainBranch = $branches->firstWhere('name', 'Head Office');
    $outletBranches = $branches->where('name', '!=', 'Head Office');

    expect($branches)->toHaveCount(4);
    expect($mainBranch)->not->toBeNull();
    expect($outletBranches)->toHaveCount(3);

    $mainBranchRegisters = CashRegister::where('created_by', $companyUser->id)
        ->where('branch_id', $mainBranch->id)
        ->count();

    expect($mainBranchRegisters)->toBe(1);

    foreach ($outletBranches as $outletBranch) {
        $outletRegisterCount = CashRegister::where('created_by', $companyUser->id)
            ->where('branch_id', $outletBranch->id)
            ->count();

        expect($outletRegisterCount)->toBeGreaterThanOrEqual(1);
    }
});

test('branch and cash register seeders are idempotent', function () {
    $companyUser = User::factory()->create([
        'type' => 'company',
    ]);

    $this->seed(BranchSeeder::class);
    $this->seed(CashRegisterSeeder::class);
    $this->seed(BranchSeeder::class);
    $this->seed(CashRegisterSeeder::class);

    $branchCount = Branch::where('created_by', $companyUser->id)->count();
    $registerCount = CashRegister::where('created_by', $companyUser->id)->count();

    expect($branchCount)->toBe(4);
    expect($registerCount)->toBeGreaterThanOrEqual(4);
});
