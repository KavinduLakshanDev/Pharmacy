<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends BaseModel
{
    use HasFactory;

    protected $table = 'customers';

    protected $fillable = [
        'user_id',
        'avatar',
        'name',
        'code',
        'email',
        'phone',
        'address',
        'type',
        'privileged_customer_number',
        'current_balance',
        'points',
    ];

    protected $casts = [
        'type' => 'string',
        'current_balance' => 'decimal:2',
        'points' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }
}
