<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\User;
use Illuminate\Database\Seeder;

class CashRegisterSeeder extends Seeder
{
    public function run(): void
    {
        $companyUsers = User::where('type', 'company')->get(['id']);

        foreach ($companyUsers as $user) {
            $existing = CashRegister::where('created_by', $user->id)->count();

            $branches = Branch::where('created_by', $user->id)
                ->orderBy('id')
                ->get();

            foreach ($branches as $branchIndex => $branch) {
                $isMainBranch = $branch->name === 'Head Office';
                $registerCount = $isMainBranch ? 1 : (($branchIndex % 2) + 1);

                for ($registerNumber = 1; $registerNumber <= $registerCount; $registerNumber++) {
                    $registerCode = sprintf('U%03dB%03dR%02d', $user->id, $branch->id, $registerNumber);

                    CashRegister::firstOrCreate([
                        'register_code' => $registerCode,
                    ], [
                        'created_by' => $user->id,
                        'branch_id' => $branch->id,
                        'name' => $isMainBranch
                            ? 'Head Office Register'
                            : "{$branch->name} Register {$registerNumber}",
                        'description' => $isMainBranch
                            ? 'Primary cash register for the main branch.'
                            : 'Cash register assigned to outlet operations.',
                        'status' => 'active',
                        'settings' => [
                            'currency' => 'LKR',
                            'receipt_prefix' => "BR{$branch->id}",
                            'allow_discounts' => true,
                        ],
                    ]);
                }
            }

            $newCount = CashRegister::where('created_by', $user->id)->count();
            $this->command->info("  ✔ Seeded cash registers for company user {$user->id}: added ".($newCount - $existing).' new record(s)');
        }
    }
}
