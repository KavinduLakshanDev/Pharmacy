<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $companyUsers = User::where('type', 'company')->get();

        if ($companyUsers->isEmpty()) {
            $this->command->warn('No company users found. Please run UserSeeder first.');

            return;
        }

        $brandTemplates = [
            ['name' => 'Oppo', 'description' => 'Orthopedic support and medical brace manufacturer', 'website' => 'https://www.oppo-medical.com'],
            ['name' => 'Sego', 'description' => 'Medical corset and abdominal support products', 'website' => 'https://www.sego-medical.com'],
            ['name' => 'N/L', 'description' => 'Neoprene and orthopedic support products', 'website' => ''],
            ['name' => 'BL Products', 'description' => 'Pharmaceutical and healthcare products', 'website' => ''],
        ];

        foreach ($companyUsers as $company) {
            foreach ($brandTemplates as $template) {
                Brand::firstOrCreate(
                    ['name' => $template['name'], 'created_by' => $company->id],
                    [
                        'name' => $template['name'],

                        'description' => $template['description'],
                        'website' => $template['website'],
                        'status' => 'active',
                        'created_by' => $company->id,
                    ]
                );
            }
        }

        $this->command->info('Brands created for all company users!');
    }
}
