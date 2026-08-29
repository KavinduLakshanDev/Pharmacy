<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $companyUsers = User::where('type', 'company')->get();

        foreach ($companyUsers as $user) {
            $createdBefore = Branch::where('created_by', $user->id)->count();

            Branch::firstOrCreate([
                'created_by' => $user->id,
                'name' => 'Head Office',
            ], [
                'address' => 'No. 100, Galle Road, Colombo 03, Sri Lanka',
                'phone' => '+94 11 123 4567',
                'email' => "headoffice-{$user->id}@branch.lk",
                'status' => 'active',
            ]);

            $outletBranches = [
                [
                    'name' => 'Colombo Outlet',
                    'address' => 'No. 22, Palm Grove, Colombo 04, Sri Lanka',
                    'phone' => '+94 11 234 5678',
                    'email' => 'colombo-outlet@branch.lk',
                ],
                [
                    'name' => 'Kandy Outlet',
                    'address' => '123 Peradeniya Road, Kandy, Sri Lanka',
                    'phone' => '+94 81 234 5678',
                    'email' => 'kandy-outlet@branch.lk',
                ],
                [
                    'name' => 'Galle Outlet',
                    'address' => '456 Lighthouse Street, Galle, Sri Lanka',
                    'phone' => '+94 91 234 5678',
                    'email' => 'galle-outlet@branch.lk',
                ],
            ];

            foreach ($outletBranches as $outletBranch) {
                Branch::firstOrCreate([
                    'created_by' => $user->id,
                    'name' => $outletBranch['name'],
                ], [
                    'address' => $outletBranch['address'],
                    'phone' => $outletBranch['phone'],
                    'email' => str_replace('@', "-{$user->id}@", $outletBranch['email']),
                    'status' => 'active',
                ]);
            }

            $createdAfter = Branch::where('created_by', $user->id)->count();
            $this->command->info("  ✔ Seeded branches for company user {$user->id}: added ".($createdAfter - $createdBefore).' new record(s)');
        }
    }
}
