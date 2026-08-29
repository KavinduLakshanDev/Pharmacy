<?php

namespace App\Models;

use App\Enums\PriceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductDetailsPrice extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $table = 'product_details_prices';

    protected $fillable = [
        'product_id',
        'price_type',
        'price',
    ];

    protected function casts(): array
    {
        return [
            'price_type' => PriceType::class,
            'price' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
