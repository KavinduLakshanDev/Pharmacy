<?php

namespace Database\Seeders;

use App\Enums\PriceType;
use App\Enums\ProductType;
use App\Models\Brand;
use App\Models\Category;
use App\Models\DrugForm;
use App\Models\GenericName;
use App\Models\Product;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $companyUsers = User::where('type', 'company')->get();

        if ($companyUsers->isEmpty()) {
            $this->command->warn('No company users found. Please run UserSeeder first.');

            return;
        }

        // code, name, price, brand, category, unit
        $productTemplates = [
            // Orthopedic & Surgical Supports
            ['code' => '610001', 'name' => 'Oppo 2260 S Abdominal Support',      'price' => 2500, 'brand' => 'Oppo',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610002', 'name' => 'Oppo 2260 M Abdominal Support',      'price' => 2500, 'brand' => 'Oppo',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610003', 'name' => 'Oppo 2260 L Abdominal Support',      'price' => 2500, 'brand' => 'Oppo',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610004', 'name' => 'Oppo 2260 XL Abdominal Support',     'price' => 2500, 'brand' => 'Oppo',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610010', 'name' => 'Oppo 4073 M Rib Belt (chest guard)', 'price' => 3500, 'brand' => 'Oppo',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610006', 'name' => 'Sego 2730 S Abdominal Corset',       'price' => 3200, 'brand' => 'Sego',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610007', 'name' => 'Sego 2730 M Abdominal Corset',       'price' => 3200, 'brand' => 'Sego',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610008', 'name' => 'Sego 2730 L Abdominal Corset',       'price' => 3200, 'brand' => 'Sego',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610009', 'name' => 'Sego 2730 XL Abdominal Corset',      'price' => 3200, 'brand' => 'Sego',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610013', 'name' => 'Sego 2730 XXL Abdominal Corset',     'price' => 3500, 'brand' => 'Sego',        'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610011', 'name' => 'Maternity Belt 4062',                'price' => 2800, 'brand' => 'BL Products', 'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610012', 'name' => 'Hallux valgus night strap 6920',     'price' => 1800, 'brand' => 'BL Products', 'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610014', 'name' => 'N/L Neoprene abdominal support',     'price' => 3000, 'brand' => 'N/L',         'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610015', 'name' => 'N/L BS-02 M 10" Abdominal Support',  'price' => 2800, 'brand' => 'N/L',         'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610016', 'name' => 'N/L BS-02 L 10" Abdominal Support',  'price' => 2800, 'brand' => 'N/L',         'category' => 'Surgical Supplies', 'unit' => 'pc'],
            ['code' => '610017', 'name' => 'N/L BS-02 L 10" Abdominal Supoport', 'price' => 2800, 'brand' => 'N/L',         'category' => 'Surgical Supplies', 'unit' => 'pc'],

            // Anti-diabetic drugs
            ['code' => '1001', 'name' => 'Acarb 50 mg Tab',              'price' => 200, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '1002', 'name' => 'Acarb 25 mg tab',              'price' => 160, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '1003', 'name' => 'Abacus 50 mg tab',             'price' => 190, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '1004', 'name' => 'Diabose 50 mg tab',            'price' => 175, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '1005', 'name' => 'Glucobay 50 mg tab',           'price' => 220, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '1006', 'name' => 'Glucobay 100 mg tab',          'price' => 280, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '1007', 'name' => 'Acarbose 50mg tab (SPC)',      'price' => 210, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '1009', 'name' => 'Glucar 50mg tablets',          'price' => 180, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '620001', 'name' => 'Acetazolamide 250mg tab (SPC)', 'price' => 250, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '669008', 'name' => 'Acetylocysteine iv',         'price' => 850, 'brand' => 'BL Products', 'category' => 'Injections', 'unit' => 'pc'],
            ['code' => '670197', 'name' => 'Nacfil 600mg tablets',       'price' => 320, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '670224', 'name' => 'Renocare OD capsulse',       'price' => 450, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],

            // Anti-inflammatory / NSAID drugs
            ['code' => '2001', 'name' => 'Aceclofanac 100mg S.P.C tab', 'price' => 165, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2002', 'name' => 'Acelo 100mg tab',             'price' => 135, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2003', 'name' => 'Acedol 100mg tab',            'price' => 140, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2004', 'name' => 'Aeronac 100mg tab',           'price' => 138, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2005', 'name' => 'Aclofen 100mg tab',           'price' => 136, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2006', 'name' => 'Apitac 100mg tab',            'price' => 142, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2007', 'name' => 'Ceclofen 100mg tab',          'price' => 140, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2008', 'name' => 'Endogesic 100mg tab',         'price' => 148, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2009', 'name' => 'Feck 100mg tab',              'price' => 135, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2010', 'name' => 'Feck SR 200mg tab',           'price' => 185, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2011', 'name' => 'Mervan 100mg tab',            'price' => 140, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2012', 'name' => 'Mobenac 100mg tab',           'price' => 142, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2013', 'name' => 'Tuffox 100mg tab',            'price' => 138, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2014', 'name' => 'Zerodol 100mg tab',           'price' => 150, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2015', 'name' => 'Zerodol CR 200mg tab',        'price' => 195, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2016', 'name' => 'Zix 100mg tab',               'price' => 140, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2017', 'name' => 'Celofen 100mg tab',           'price' => 142, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2018', 'name' => 'Acebid 100mg tab',            'price' => 138, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2019', 'name' => 'Acelo 100mg tab',             'price' => 135, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2020', 'name' => 'Ceclof 100mg tab',            'price' => 140, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2021', 'name' => 'Actinac 100mg tab',           'price' => 145, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2022', 'name' => 'Moviz 100mg tab',             'price' => 150, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2023', 'name' => 'Aceclodeal 100mg Tabs',       'price' => 148, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2024', 'name' => 'Ceclo 100mg Tabs',            'price' => 142, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2025', 'name' => 'Acenac 100mg Tabs',           'price' => 138, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2026', 'name' => 'Aceflex 100mg Tabs',          'price' => 144, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2027', 'name' => 'Dolowin - SR 200mg Tabs',     'price' => 195, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2028', 'name' => 'Suppains tablets 100mg',      'price' => 155, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2029', 'name' => 'Flexi 100mg tablats',         'price' => 145, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2030', 'name' => 'Asfy 100mg tablets',          'price' => 145, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2031', 'name' => 'Riha 100mg tablets',          'price' => 160, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2032', 'name' => 'Acefen 100mg tablets',        'price' => 148, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2034', 'name' => 'Riha sr 200mg',               'price' => 180, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2035', 'name' => 'Algic 100mg tab',             'price' => 140, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],
            ['code' => '2036', 'name' => 'Acelodon 100mg tablets',      'price' => 150, 'brand' => 'BL Products', 'category' => 'Drugs', 'unit' => 'pack'],

            // Antiviral drugs
            ['code' => '101003', 'name' => 'Soritec 10mg tablats',       'price' => 280, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3001',   'name' => 'Acyclovir 200mg Tab (SPC)',  'price' => 350, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3002',   'name' => 'Herperax 200mg Tab',         'price' => 340, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3003',   'name' => 'Herperax 800mg Tabs',        'price' => 480, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3004',   'name' => 'Herperax Ointment 5g',       'price' => 380, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3005',   'name' => 'Acyvir ointment 3%',         'price' => 360, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3006',   'name' => 'Declovir Cream',             'price' => 420, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3007',   'name' => 'Zovirax Cream 5% 2mg',       'price' => 450, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3008',   'name' => 'Acylex 5% Ointment 5g',      'price' => 395, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3009',   'name' => 'Santovir 3% Eye oint',       'price' => 420, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3010',   'name' => 'Aciherpin Cream 5g',         'price' => 380, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3011',   'name' => 'Aciherpin 200mg tablets',    'price' => 320, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3012',   'name' => 'Zovirax 250mg injection',    'price' => 950, 'brand' => 'BL Products', 'category' => 'Injections', 'unit' => 'pc'],
            ['code' => '3013',   'name' => 'Zovirax 200mg tablets',      'price' => 380, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3014',   'name' => 'Clovirex 800mg tablets',     'price' => 520, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3015',   'name' => 'Virless 800mg tablats',      'price' => 490, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3016',   'name' => 'Aciherpin 400mg tablats',    'price' => 420, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3018',   'name' => 'Clovirex cream',             'price' => 480, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pc'],
            ['code' => '3019',   'name' => 'Aciherpin 800mg tablets',    'price' => 560, 'brand' => 'BL Products', 'category' => 'Drugs',      'unit' => 'pack'],
            ['code' => '3020',   'name' => 'Univir 250mg inj',           'price' => 1100, 'brand' => 'BL Products', 'category' => 'Injections', 'unit' => 'pc'],

            // Acne / Skin treatments
            ['code' => '273395', 'name' => 'Acneklene cream 15g',             'price' => 580, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4001',   'name' => 'Adaferin gel 0.1% 15mg',          'price' => 680, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4003',   'name' => 'Deriva Aqueous 0.1% Gel 15g',     'price' => 650, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4004',   'name' => 'Adipin gel',                       'price' => 480, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4005',   'name' => 'Fona 0.1% Cream 10g',             'price' => 540, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4006',   'name' => 'Aclene gel 15g',                   'price' => 490, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4007',   'name' => 'Adapalene Gel 15g',                'price' => 720, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4008',   'name' => 'Adapco Gel 15g',                   'price' => 580, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4009',   'name' => 'Adapco Cream 15g',                 'price' => 560, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4010',   'name' => 'Acnepale 0.1% gel',                'price' => 610, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4011',   'name' => 'duac gel',                          'price' => 780, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4012',   'name' => 'Clear cream',                       'price' => 420, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '4013',   'name' => 'Acne-Lene 0.1% cream',             'price' => 620, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '5001',   'name' => 'Adacin gel 15mg',                  'price' => 680, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
            ['code' => '5004',   'name' => 'Clinaline gel 30g',                'price' => 850, 'brand' => 'BL Products', 'category' => 'Cosmetics', 'unit' => 'pc'],
        ];

        foreach ($companyUsers as $company) {
            $categories = Category::where('created_by', $company->id)->get()->keyBy('name');
            $brands = Brand::where('created_by', $company->id)->get()->keyBy('name');
            $taxes = Tax::where('created_by', $company->id)->get();
            $units = Unit::where('status', 'active')->get()->keyBy('name');
            $drugForms = DrugForm::where('created_by', $company->id)->get()->keyBy('name');
            $genericNames = GenericName::where('created_by', $company->id)->get();
            $staffUsers = User::where('created_by', $company->id)->get();

            if ($categories->isEmpty() || $brands->isEmpty() || $taxes->isEmpty()) {
                $this->command->warn("Skipping company {$company->id}: missing categories, brands, or taxes.");

                continue;
            }

            foreach ($productTemplates as $template) {
                $brand = $brands->get($template['brand']);
                $category = $categories->get($template['category']);
                $unit = $units->get($template['unit']);

                if (! $brand || ! $category) {
                    $this->command->warn("Skipping {$template['name']}: brand '{$template['brand']}' or category '{$template['category']}' not found.");

                    continue;
                }

                $product = Product::updateOrCreate(
                    ['sku' => $template['code'], 'created_by' => $company->id],
                    [
                        'name' => $template['name'],
                        'product_type' => ProductType::FinishedProduct->value,
                        'sku' => $template['code'],
                        'description' => $template['name'].' - pharmaceutical product.',
                        'price' => $template['price'],
                        'stock_quantity' => 0,
                        'category_id' => $category->id,
                        'brand_id' => $brand->id,
                        'tax_id' => $taxes->random()->id,
                        'unit_id' => $unit?->id,
                        'drug_form_id' => $drugForms->get($template['category'])?->id ?? ($drugForms->isNotEmpty() ? $drugForms->random()->id : null),
                        'generic_name_id' => $genericNames->isNotEmpty() ? $genericNames->random()->id : null,
                        'reorder_level' => 10,
                        'expire_date' => '730', // Default to 2 years in days
                        'pack_size' => '1x10',
                        'status' => 'active',
                        'created_by' => $company->id,
                        'assigned_to' => $staffUsers->isNotEmpty() ? $staffUsers->random()->id : null,
                    ]
                );

                // Create or update prices
                $product->detailsPrices()->updateOrCreate(
                    ['price_type' => PriceType::SalesPrice->value],
                    ['price' => $template['price']]
                );

                $product->detailsPrices()->updateOrCreate(
                    ['price_type' => PriceType::CostPrice->value],
                    ['price' => $template['price'] * 0.8] // Assume 20% margin for seeding
                );
            }

            $this->command->info("Products created for company: {$company->name} (id={$company->id})");
        }
    }
}
