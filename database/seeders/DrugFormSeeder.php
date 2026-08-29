<?php

namespace Database\Seeders;

use App\Models\DrugForm;
use App\Models\User;
use Illuminate\Database\Seeder;

class DrugFormSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companyUsers = User::where('type', 'company')->get();

        if ($companyUsers->isEmpty()) {
            $this->command->warn('No company users found. Please run UserSeeder first.');

            return;
        }

        $drugFormTemplates = [
            ['name' => 'Drugs', 'description' => 'General medicines and pharmaceutical drug products.'],
            ['name' => 'Surgical Supplies', 'description' => 'Surgical instruments, dressings, and related medical supplies.'],
            ['name' => 'Injections', 'description' => 'Injectable medicines, ampoules, and vials.'],
            ['name' => 'Vaccinations', 'description' => 'Vaccines and immunization products.'],
            ['name' => 'Infusions', 'description' => 'IV fluids and infusion therapy products.'],
            ['name' => 'Other', 'description' => 'Other dosage forms and product types.'],
            ['name' => 'Cosmetics', 'description' => 'Cosmetic, skincare, and personal care products.'],
        ];

        foreach ($companyUsers as $company) {
            foreach ($drugFormTemplates as $template) {
                DrugForm::firstOrCreate(
                    ['name' => $template['name'], 'created_by' => $company->id],
                    [
                        'description' => $template['description'],
                        'status' => 'active',
                    ],
                );
            }
        }

        $this->command->info('Drug forms created for all company users!');
    }
}
