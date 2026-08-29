<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerReturnItem extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'customer_return_id',
        'grn_item_id',
        'sales_transaction_item_id',
        'product_id',
        'quantity',
        'unit_price',
        'total_price',
        'batch_no',
        'expiry_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function customerReturn(): BelongsTo
    {
        return $this->belongsTo(CustomerReturn::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function grnItem(): BelongsTo
    {
        return $this->belongsTo(GrnItem::class);
    }

    public function salesTransactionItem(): BelongsTo
    {
        return $this->belongsTo(SalesTransactionItem::class);
    }
}
