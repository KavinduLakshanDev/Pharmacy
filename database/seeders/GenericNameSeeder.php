<?php

namespace Database\Seeders;

use App\Models\GenericName;
use App\Models\User;
use Illuminate\Database\Seeder;

class GenericNameSeeder extends Seeder
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

        $genericNameTemplates = [
            ['name' => 'Paracetamol', 'description' => 'Analgesic and antipyretic medicine used for pain and fever.'],
            ['name' => 'Amoxicillin', 'description' => 'Penicillin antibiotic used for bacterial infections.'],
            ['name' => 'Ibuprofen', 'description' => 'Nonsteroidal anti-inflammatory drug used for pain and inflammation.'],
            ['name' => 'Cetirizine', 'description' => 'Antihistamine used for allergy relief.'],
            ['name' => 'Loratadine', 'description' => 'Non-drowsy antihistamine used for allergy symptoms.'],
            ['name' => 'Metformin', 'description' => 'Oral medicine used to manage type 2 diabetes.'],
            ['name' => 'Amlodipine', 'description' => 'Calcium channel blocker used for hypertension and angina.'],
            ['name' => 'Atorvastatin', 'description' => 'Statin medicine used to manage cholesterol.'],
            ['name' => 'Omeprazole', 'description' => 'Proton pump inhibitor used for acid reflux and ulcers.'],
            ['name' => 'Pantoprazole', 'description' => 'Proton pump inhibitor used to reduce stomach acid.'],
            ['name' => 'Azithromycin', 'description' => 'Macrolide antibiotic used for bacterial infections.'],
            ['name' => 'Ciprofloxacin', 'description' => 'Fluoroquinolone antibiotic used for bacterial infections.'],
            ['name' => 'Doxycycline', 'description' => 'Tetracycline antibiotic used for infections and acne.'],
            ['name' => 'Losartan', 'description' => 'Angiotensin receptor blocker used for high blood pressure.'],
            ['name' => 'Enalapril', 'description' => 'ACE inhibitor used for hypertension and heart failure.'],
            ['name' => 'Salbutamol', 'description' => 'Bronchodilator used for asthma and breathing difficulty.'],
            ['name' => 'Prednisolone', 'description' => 'Corticosteroid used for inflammation and allergic conditions.'],
            ['name' => 'Diclofenac', 'description' => 'NSAID used for pain and inflammation.'],
            ['name' => 'Aspirin', 'description' => 'Antiplatelet and analgesic medicine.'],
            ['name' => 'Clopidogrel', 'description' => 'Antiplatelet medicine used to prevent blood clots.'],
            ['name' => 'Warfarin', 'description' => 'Anticoagulant medicine used to prevent blood clots.'],
            ['name' => 'Levothyroxine', 'description' => 'Thyroid hormone replacement medicine.'],
            ['name' => 'Insulin', 'description' => 'Hormone therapy used to manage diabetes.'],
            ['name' => 'Furosemide', 'description' => 'Loop diuretic used for fluid retention and hypertension.'],
            ['name' => 'Hydrochlorothiazide', 'description' => 'Thiazide diuretic used for hypertension.'],
            ['name' => 'Fluconazole', 'description' => 'Antifungal medicine used for fungal infections.'],
            ['name' => 'Acyclovir', 'description' => 'Antiviral medicine used for herpes virus infections.'],
            ['name' => 'Montelukast', 'description' => 'Leukotriene receptor antagonist used for asthma and allergies.'],
            ['name' => 'Ondansetron', 'description' => 'Antiemetic medicine used for nausea and vomiting.'],
            ['name' => 'Domperidone', 'description' => 'Medicine used for nausea and gastric motility.'],
            ['name' => 'Ranitidine', 'description' => 'H2 blocker used to reduce stomach acid.'],
            ['name' => 'Vitamin D3', 'description' => 'Supplement used for vitamin D deficiency.'],
        ];

        foreach ($companyUsers as $company) {
            foreach ($genericNameTemplates as $template) {
                GenericName::firstOrCreate(
                    ['name' => $template['name'], 'created_by' => $company->id],
                    [
                        'description' => $template['description'],
                        'status' => 'active',
                    ],
                );
            }
        }

        $this->command->info('Generic names created for all company users!');
    }
}
