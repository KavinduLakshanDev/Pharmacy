<?php

namespace App\Models;

use App\Enums\VatRegistrationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends BaseModel
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'company_name',
        'address',
        'tel_no',
        'mail',
        'website',
        'vat_registered',
        'vat_no',
        'contact_person_name',
        'contact_no',
    ];

    protected $casts = [
        'vat_registered' => VatRegistrationStatus::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}
