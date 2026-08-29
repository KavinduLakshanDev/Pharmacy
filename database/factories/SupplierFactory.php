<?php

namespace Database\Factories;

use App\Enums\VatRegistrationStatus;
/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Supplier>
 */
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $vatRegistered = $this->faker->boolean(70) ? VatRegistrationStatus::Registered : VatRegistrationStatus::NotRegistered;

        return [
            'company_name' => $this->faker->company(),
            'address' => $this->faker->address(),
            'tel_no' => $this->faker->phoneNumber(),
            'mail' => $this->faker->unique()->safeEmail(),
            'website' => $this->faker->optional()->url(),
            'vat_registered' => $vatRegistered,
            'vat_no' => $vatRegistered === VatRegistrationStatus::Registered ? $this->faker->bothify('??########') : null,
            'contact_person_name' => $this->faker->name(),
            'contact_no' => $this->faker->phoneNumber(),
        ];
    }
}
