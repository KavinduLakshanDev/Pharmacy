<?php

namespace Database\Seeders;

use App\Models\DeliveryRoute;
use Illuminate\Database\Seeder;

class DeliveryRouteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $routes = [
            [
                'routename' => 'Colombo Central',
                'routecode' => 'COL01',
                'description' => 'Central Colombo delivery route',
            ],
            [
                'routename' => 'Negombo Route',
                'routecode' => 'NEG01',
                'description' => 'Negombo area delivery route',
            ],
            [
                'routename' => 'Gampaha Delivery',
                'routecode' => 'GAM01',
                'description' => 'Gampaha district delivery route',
            ],
            [
                'routename' => 'Kelaniya Route',
                'routecode' => 'KEL01',
                'description' => 'Kelaniya area delivery route',
            ],
            [
                'routename' => 'Ja-Ela Route',
                'routecode' => 'JAE01',
                'description' => 'Ja-Ela delivery route',
            ],
            [
                'routename' => 'Kandy Central',
                'routecode' => 'KAN01',
                'description' => 'Kandy city delivery route',
            ],
            [
                'routename' => 'Galle Route',
                'routecode' => 'GAL01',
                'description' => 'Galle district delivery route',
            ],
            [
                'routename' => 'Matara Route',
                'routecode' => 'MAT01',
                'description' => 'Matara area delivery route',
            ],
            [
                'routename' => 'Jaffna Route',
                'routecode' => 'JAF01',
                'description' => 'Jaffna peninsula delivery route',
            ],
            [
                'routename' => 'Anuradhapura Route',
                'routecode' => 'ANU01',
                'description' => 'Anuradhapura district delivery route',
            ],
            [
                'routename' => 'Trincomalee Route',
                'routecode' => 'TRI01',
                'description' => 'Trincomalee area delivery route',
            ],
            [
                'routename' => 'Batticaloa Route',
                'routecode' => 'BAT01',
                'description' => 'Batticaloa district delivery route',
            ],
            [
                'routename' => 'Kurunegala Route',
                'routecode' => 'KUR01',
                'description' => 'Kurunegala area delivery route',
            ],
            [
                'routename' => 'Ratnapura Route',
                'routecode' => 'RAT01',
                'description' => 'Ratnapura district delivery route',
            ],
            [
                'routename' => 'Badulla Route',
                'routecode' => 'BAD01',
                'description' => 'Badulla area delivery route',
            ],
            [
                'routename' => 'Colombo North',
                'routecode' => 'COL02',
                'description' => 'Northern Colombo delivery route',
            ],
            [
                'routename' => 'Colombo South',
                'routecode' => 'COL03',
                'description' => 'Southern Colombo delivery route',
            ],
            [
                'routename' => 'Colombo East',
                'routecode' => 'COL04',
                'description' => 'Eastern Colombo delivery route',
            ],
            [
                'routename' => 'Colombo West',
                'routecode' => 'COL05',
                'description' => 'Western Colombo delivery route',
            ],
            [
                'routename' => 'Dehiwala Route',
                'routecode' => 'DEH01',
                'description' => 'Dehiwala-Mount Lavinia delivery route',
            ],
            [
                'routename' => 'Moratuwa Route',
                'routecode' => 'MOR01',
                'description' => 'Moratuwa area delivery route',
            ],
            [
                'routename' => 'Kalutara Route',
                'routecode' => 'KAL01',
                'description' => 'Kalutara district delivery route',
            ],
            [
                'routename' => 'Panadura Route',
                'routecode' => 'PAN01',
                'description' => 'Panadura area delivery route',
            ],
            [
                'routename' => 'Horana Route',
                'routecode' => 'HOR01',
                'description' => 'Horana delivery route',
            ],
            [
                'routename' => 'Avissawella Route',
                'routecode' => 'AVI01',
                'description' => 'Avissawella area delivery route',
            ],
            [
                'routename' => 'Minuwangoda Route',
                'routecode' => 'MIN01',
                'description' => 'Minuwangoda delivery route',
            ],
            [
                'routename' => 'Wattala Route',
                'routecode' => 'WAT01',
                'description' => 'Wattala area delivery route',
            ],
            [
                'routename' => 'Kandana Route',
                'routecode' => 'KAN02',
                'description' => 'Kandana delivery route',
            ],
            [
                'routename' => 'Ragama Route',
                'routecode' => 'RAG01',
                'description' => 'Ragama area delivery route',
            ],
            [
                'routename' => 'Kadawatha Route',
                'routecode' => 'KAD01',
                'description' => 'Kadawatha delivery route',
            ],
            [
                'routename' => 'Kiribathgoda Route',
                'routecode' => 'KIR01',
                'description' => 'Kiribathgoda area delivery route',
            ],
            [
                'routename' => 'Nittambuwa Route',
                'routecode' => 'NIT01',
                'description' => 'Nittambuwa delivery route',
            ],
            [
                'routename' => 'Matale Route',
                'routecode' => 'MAT02',
                'description' => 'Matale district delivery route',
            ],
            [
                'routename' => 'Dambulla Route',
                'routecode' => 'DAM01',
                'description' => 'Dambulla area delivery route',
            ],
            [
                'routename' => 'Sigiriya Route',
                'routecode' => 'SIG01',
                'description' => 'Sigiriya delivery route',
            ],
            [
                'routename' => 'Polonnaruwa Route',
                'routecode' => 'POL01',
                'description' => 'Polonnaruwa district delivery route',
            ],
            [
                'routename' => 'Habarana Route',
                'routecode' => 'HAB01',
                'description' => 'Habarana area delivery route',
            ],
            [
                'routename' => 'Nuwara Eliya Route',
                'routecode' => 'NUW01',
                'description' => 'Nuwara Eliya district delivery route',
            ],
            [
                'routename' => 'Hatton Route',
                'routecode' => 'HAT01',
                'description' => 'Hatton area delivery route',
            ],
            [
                'routename' => 'Talawakele Route',
                'routecode' => 'TAL01',
                'description' => 'Talawakele delivery route',
            ],
            [
                'routename' => 'Haputale Route',
                'routecode' => 'HAP01',
                'description' => 'Haputale area delivery route',
            ],
            [
                'routename' => 'Bandarawela Route',
                'routecode' => 'BAN01',
                'description' => 'Bandarawela delivery route',
            ],
            [
                'routename' => 'Ella Route',
                'routecode' => 'ELL01',
                'description' => 'Ella area delivery route',
            ],
            [
                'routename' => 'Wellawaya Route',
                'routecode' => 'WEL01',
                'description' => 'Wellawaya delivery route',
            ],
            [
                'routename' => 'Monaragala Route',
                'routecode' => 'MON01',
                'description' => 'Monaragala district delivery route',
            ],
        ];

        foreach ($routes as $route) {
            DeliveryRoute::create($route);
        }
    }
}
