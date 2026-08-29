<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PettyCashEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'finance_account_id',
        'petty_cash_category_id',
        'created_by',
        'entry_date',
        'type',
        'particulars',
        'reference',
        'notes',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'total_amount' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_account_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
