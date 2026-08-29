<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrugDestroyItem extends BaseModel
{
    protected $fillable = [
        'drug_destroy_id',
        'product_id',
        'batch_no',
        'expiry_date',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function drugDestroy(): BelongsTo
    {
        return $this->belongsTo(DrugDestroy::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
