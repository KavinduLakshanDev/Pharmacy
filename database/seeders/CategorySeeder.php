<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $companyUsers = User::where('type', 'company')->get();

        if ($companyUsers->isEmpty()) {
            $this->command->warn('No company users found. Please run UserSeeder first.');

            return;
        }

        $categoryTemplates = [
            ['name' => 'Drugs', 'description' => 'Prescription and over-the-counter pharmaceutical drugs'],
            ['name' => 'Injections', 'description' => 'Injectable medications and ampoules'],
            ['name' => 'Surgical Supplies', 'description' => 'Surgical instruments and medical supplies'],
            ['name' => 'Vaccinations', 'description' => 'Vaccines and immunization products'],
            ['name' => 'Infusions', 'description' => 'IV fluids and infusion therapy products'],
            ['name' => 'Cosmetics', 'description' => 'Skincare, beauty, and personal care products'],
            ['name' => 'Others', 'description' => 'Miscellaneous pharmaceutical and health products'],
        ];

        foreach ($companyUsers as $company) {
            foreach ($categoryTemplates as $template) {
                Category::firstOrCreate(
                    ['slug' => Str::slug($template['name']), 'created_by' => $company->id],
                    [
                        'name' => $template['name'],
                        'slug' => Str::slug($template['name']),
                        'description' => $template['description'],
                        'status' => 'active',
                        'created_by' => $company->id,
                    ]
                );
            }
        }

        $this->command->info('Categories created for all company users!');
    }
}
