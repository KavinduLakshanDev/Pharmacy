<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class FinancePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'finance_transaction_id',
        'payer_type',
        'payer_id',
        'payee_type',
        'payee_id',
        'payment_method',
        'status',
        'created_by',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinanceTransaction::class, 'finance_transaction_id');
    }

    public function payer(): MorphTo
    {
        return $this->morphTo();
    }

    public function payee(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function details(): HasOne
    {
        return $this->hasOne(FinancePaymentDetail::class);
    }
}
