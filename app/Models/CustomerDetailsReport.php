<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class CustomerDetailsReport extends BaseModel
{
    use HasFactory;

    protected $table = 'customers';

    protected $fillable = [
        'name',
        'code',
        'email',
        'phone',
        'address',
        'type',
        'privileged_customer_number',
    ];

    protected $casts = [
        'type' => 'string',
    ];
}
