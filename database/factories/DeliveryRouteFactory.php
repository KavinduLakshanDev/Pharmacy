<?php

namespace Database\Factories;

use App\Models\DeliveryRoute;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeliveryRouteFactory extends Factory
{
    protected $model = DeliveryRoute::class;

    public function definition(): array
    {
        return [
            'routename' => $this->faker->unique()->words(2, true),
            'routecode' => $this->faker->unique()->regexify('[A-Z]{2}[0-9]{3}'),
            'description' => $this->faker->sentence(),
            'created_by' => User::factory(),
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'updated_at' => function (array $attributes) {
                return $this->faker->dateTimeBetween($attributes['created_at'], 'now');
            },
        ];
    }
}
