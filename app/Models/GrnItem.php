<?php

namespace App\Models;

use App\Enums\DiscountType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class GrnItem extends BaseModel
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'grn_id',
        'product_id',
        'quantity',
        'free_qty',
        'unit_price',
        'total_price',
        'discount_type',
        'discount_value',
        'discount_amount',
        'expiry_date',
        'batch_no',
        'pack_size',
        'new_cost_price',
        'sale_price',
        'unit_cost_price',
        'unit_sales_price',
        'unit_stock',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'free_qty' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'new_cost_price' => 'decimal:4',
        'sale_price' => 'decimal:4',
        'unit_cost_price' => 'decimal:4',
        'unit_sales_price' => 'decimal:4',
        'unit_stock' => 'decimal:4',
        'discount_type' => DiscountType::class,
        'expiry_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function grn()
    {
        return $this->belongsTo(Grn::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
