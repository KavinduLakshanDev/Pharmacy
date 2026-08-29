<?php

namespace Database\Seeders;

use App\Enums\VatRegistrationStatus;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Supplier::withTrashed()->forceDelete();

        $suppliers = [
            'MedPharm Global Ltd',
            'CuraGen Pharmaceuticals',
            'VitaCare Supplies Inc.',
            'BioSynth Laboratories',
            'Nordic Cold Chain GmbH',
            'PharmaLink Asia Pte Ltd',
            'GenRx Distributors',
            'EuroMed Wholesale BV',
            'Apex Surgical Supplies',
            'LifeGen Biotech Corp',
            'MedEssentials Pvt Ltd',
            'FrostVault Pharma',
            'OmegaDrug Wholesale',
            'MediCore Supplies FZCO',
            'PrimePharma Japan KK',
        ];

        foreach ($suppliers as $index => $companyName) {
            $slug = Str::slug($companyName, '');
            $registered = $index % 3 === 0;

            Supplier::create([
                'company_name' => $companyName,
                'address' => "{$companyName} Headquarters, 100 Market Street",
                'tel_no' => sprintf('+1-800-555-%04d', 1000 + $index),
                'mail' => sprintf('contact@%s.com', $slug),
                'website' => sprintf('https://www.%s.com', Str::slug($companyName, '-')),
                'vat_registered' => $registered ? VatRegistrationStatus::Registered : VatRegistrationStatus::NotRegistered,
                'vat_no' => $registered ? sprintf('VAT-%06d', 100000 + $index) : null,
                'contact_person_name' => $this->contactPersonName($index),
                'contact_no' => sprintf('+1-800-555-%04d', 2000 + $index),
            ]);
        }
    }

    private function contactPersonName(int $index): string
    {
        $names = [
            'Alex Morgan',
            'Taylor Reed',
            'Jordan Blake',
            'Casey Parker',
            'Morgan Lee',
            'Sydney Cole',
            'Jamie Brooks',
            'Riley Quinn',
            'Avery James',
            'Peyton Cross',
            'Logan Hayes',
            'Drew Ellis',
            'Sam Rivers',
            'Charlie Hart',
            'Taylor Mason',
        ];

        return $names[$index % count($names)];
    }
}
