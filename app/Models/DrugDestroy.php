<?php

namespace App\Models;

use App\Enums\MasterTransactionSourceType;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DrugDestroy extends BaseModel
{
    protected $fillable = [
        'destroy_number',
        'branch_id',
        'destroy_date',
        'notes',
        'total_amount',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'destroy_date' => 'date',
        'approved_at' => 'datetime',
        'total_amount' => 'decimal:2',
    ];

    public static function generateDestroyNumber(): string
    {
        $count = static::count() + 1;

        return sprintf('DDR-%s-%06d', now()->format('Ymd'), $count);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(DrugDestroyItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function masterTransactions(): HasMany
    {
        return $this->hasMany(MasterTransaction::class, 'transactionable_id')
            ->where('transactionable_type', MasterTransactionSourceType::DrugDestroy->value);
    }
}
