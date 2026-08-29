<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure Walk-in customer exists
        Customer::firstOrCreate(
            ['name' => 'Walk-in Customer'],
            [
                'code' => 'CUST000',
                'email' => 'walkin@unitec.test',
                'phone' => '0000000000',
                'type' => 'customer',
                'address' => 'N/A',
            ]
        );

        // Create sample customers
        $customers = [
            [
                'name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'phone' => '1234567890',
                'address' => '123 Main Street, New York, NY 10001',
                'type' => 'customer',
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane.smith@example.com',
                'phone' => '+12345678901',
                'address' => '456 Oak Avenue, Los Angeles, CA 90210',
                'type' => 'customer',
            ],
            [
                'name' => 'Bob Johnson',
                'email' => 'bob.johnson@example.com',
                'phone' => '9876543210',
                'address' => '789 Pine Road, Chicago, IL 60601',
                'type' => 'customer',
            ],
            [
                'name' => 'Alice Brown',
                'email' => 'alice.brown@example.com',
                'phone' => '+19876543210',
                'address' => '321 Elm Street, Houston, TX 77001',
                'type' => 'customer',
            ],
            [
                'name' => 'Charlie Wilson',
                'email' => 'charlie.wilson@example.com',
                'phone' => '5551234567',
                'address' => '654 Maple Drive, Phoenix, AZ 85001',
                'type' => 'customer',
            ],
        ];

        $allRecords = $customers;

        foreach ($allRecords as $record) {
            // Auto-generate code for each record
            $type = $record['type'];
            $prefix = 'CUST';
            $lastCustomer = Customer::where('type', $type)->orderBy('id', 'desc')->first();
            $nextNumber = $lastCustomer ? intval(substr($lastCustomer->code, 4)) + 1 : 1;
            $record['code'] = $prefix.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            Customer::firstOrCreate(
                ['email' => $record['email']],
                $record
            );
        }

        $this->command->info('Customer seeder completed successfully!');
        $this->command->info('Created '.count($customers).' customers');
    }
}
