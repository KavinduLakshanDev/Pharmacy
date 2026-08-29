<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CustomerRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customerRole = Role::firstOrCreate(
            ['name' => 'customer', 'guard_name' => 'web'],
            [
                'label' => 'Customer',
                'description' => 'Customer has access to the self-service customer portal',
                'created_by' => null,
            ]
        );

        $permission = Permission::firstOrCreate(
            ['name' => 'view-customer-portal', 'guard_name' => 'web'],
            [
                'module' => 'customer_portal',
                'label' => 'View Customer Portal',
                'description' => 'Access customer self-service portal',
            ]
        );

        $customerRole->syncPermissions([$permission]);
    }
}
