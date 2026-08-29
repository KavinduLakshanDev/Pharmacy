<?php

namespace App\Models;

use App\Enums\FinanceAccountStatus;
use App\Enums\FinanceAccountType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinanceAccount extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'branch_id',
        'name',
        'account_type',
        'status',
        'description',
        'bank_branch',
        'bank_account_no',
    ];

    protected function casts(): array
    {
        return [
            'account_type' => FinanceAccountType::class,
            'status' => FinanceAccountStatus::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class);
    }

    public function pettyCashEntries(): HasMany
    {
        return $this->hasMany(PettyCashEntry::class);
    }

    public function balance(): float
    {
        $credits = $this->transactions()->where('type', 'credit')->sum('amount');
        $debits = $this->transactions()->where('type', 'debit')->sum('amount');

        return (float) ($credits - $debits);
    }
}
