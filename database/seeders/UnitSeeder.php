<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $units = [
            'pc',
            'pack',
            'box',
            'set',
            'kg',
            'g',
            'mg',
            'l',
            'ml',
            'm',
            'cm',
            'in',
            'ft',
        ];

        foreach ($units as $unitName) {
            Unit::updateOrCreate(
                ['name' => $unitName],
                ['status' => 'active', 'description' => null]
            );
        }
    }
}
