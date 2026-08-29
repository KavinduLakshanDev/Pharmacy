<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'image_path',
        'customer_notes',
        'delivery_requested',
        'delivery_address',
        'delivery_charge',
        'status',
        'staff_message',
        'medicine_items',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'string',
        'medicine_items' => 'array',
        'delivery_requested' => 'boolean',
        'delivery_charge' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(PrescriptionMessage::class)->orderBy('created_at');
    }

    public function getImageUrlAttribute(): string
    {
        return asset('storage/'.$this->image_path);
    }
}
