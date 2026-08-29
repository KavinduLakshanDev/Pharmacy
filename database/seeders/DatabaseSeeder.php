<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Core system seeders
            PermissionSeeder::class,
            RoleSeeder::class,
            CustomerRoleSeeder::class,
            PlanSeeder::class,

            // Company and User seeders
            UserSeeder::class,
            // CompanySeeder::class,
            GenericNameSeeder::class,
            DrugFormSeeder::class,
            BranchSeeder::class,
            CashRegisterSeeder::class,
            StaffRoleSeeder::class,

            // System Configuration seeders
            LandingPageCustomPageSeeder::class,
            CurrencySeeder::class,
            TaxSeeder::class,
            UnitSeeder::class,

            // Customers and suppliers
            CustomerSeeder::class,
            SupplierSeeder::class,

            // DeliveryRouteSeeder::class,

            BrandSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,

            // MasterTransactionSeeder::class,

            // GrnSeeder::class,

            EmailTemplateSeeder::class,
            NotificationTemplateSeeder::class,

            // ContactMessageSeeder::class,
            // NewsletterSeeder::class,

            LoginHistorySeeder::class,
        ]);
    }
}
