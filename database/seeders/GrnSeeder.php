<?php

namespace Database\Seeders;

use App\Models\Grn;
use Illuminate\Database\Seeder;

class GrnSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Grn::factory()->count(5)->has(\App\Models\GrnItem::factory()->count(3), 'items')->create();
    }
}
