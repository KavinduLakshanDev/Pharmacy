<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'customer_return_id',
        'payment_method',
        'paid_amount',
        'payment_date',
        'notes',
        'bank_account_id',
        'cheque_no',
        'cheque_bank_name',
        'cheque_branch',
        'cheque_date',
        'cheque_account_no',
        'bank_name',
        'bank_reference_no',
        'bank_branch',
        'bank_deposit_date',
        'bank_account_no',
        'transfer_reference_no',
        'transfer_transaction_id',
        'transfer_bank_name',
        'transfer_branch',
        'transfer_date',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'cheque_date' => 'date',
        'bank_deposit_date' => 'date',
        'transfer_date' => 'date',
        'paid_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function customerReturn(): BelongsTo
    {
        return $this->belongsTo(CustomerReturn::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'bank_account_id');
    }
}
