<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalePayment extends Model
{
    protected $fillable = [
        'sales_transaction_id',
        'payment_method',
        'amount',
        'finance_account_id',
        'cheque_no',
        'cheque_date',
        'cheque_bank',
        'cheque_branch',
    ];

    public function sale()
    {
        return $this->belongsTo(SalesTransaction::class, 'sales_transaction_id');
    }

    public function account()
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_account_id');
    }
}
