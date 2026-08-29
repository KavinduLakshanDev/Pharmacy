<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTransferItem extends BaseModel
{
    /** @use HasFactory<\Database\Factories\StockTransferItemFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'stock_transfer_id',
        'product_id',
        'batch_no',
        'quantity',
        'unit_price',
        'unit_cost_price',
        'total_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'unit_price' => 'decimal:2',
            'unit_cost_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    public function stockTransfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
