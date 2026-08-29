<?php

namespace App\Models;

use App\Enums\MasterTransactionSourceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class CustomerReturn extends BaseModel
{
    /** @use HasFactory<\Database\Factories\CustomerReturnFactory> */
    use HasFactory;

    protected $fillable = [
        'return_number',
        'customer_id',
        'sales_transaction_id',
        'grn_id',
        'branch_id',
        'return_date',
        'notes',
        'status',
        'sub_total',
        'total_amount',
        'invoice_return_credit',
        'exchange_purchase_amount',
        'customer_additional_payment_due',
        'customer_credit_after_exchange',
        'created_by',
    ];

    protected $casts = [
        'return_date' => 'date',
        'sub_total' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'invoice_return_credit' => 'decimal:2',
        'exchange_purchase_amount' => 'decimal:2',
        'customer_additional_payment_due' => 'decimal:2',
        'customer_credit_after_exchange' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $customerReturn): void {
            $transactions = $customerReturn->masterTransactions()->orderByDesc('id')->get();

            if ($transactions->isEmpty()) {
                return;
            }

            $transactionsByScope = $transactions->groupBy(function (MasterTransaction $transaction): string {
                $stockType = $transaction->getRawOriginal('stock_type') ?? 'null';
                $stockTypeId = $transaction->stock_type_id ?? 'null';

                return "{$transaction->product_id}:{$stockType}:{$stockTypeId}";
            });

            DB::transaction(function () use ($transactions, $transactionsByScope): void {
                foreach ($transactions as $transaction) {
                    $transaction->delete();
                }

                foreach ($transactionsByScope as $transactionsForScope) {
                    /** @var MasterTransaction $firstTransaction */
                    $firstTransaction = $transactionsForScope->first();

                    MasterTransaction::recalculateLedgerForScope(
                        $firstTransaction->product_id,
                        $firstTransaction->getRawOriginal('stock_type'),
                        $firstTransaction->stock_type_id,
                    );
                }
            });
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function grn(): BelongsTo
    {
        return $this->belongsTo(Grn::class);
    }

    public function salesTransaction(): BelongsTo
    {
        return $this->belongsTo(SalesTransaction::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CustomerReturnItem::class);
    }

    public function masterTransactions(): HasMany
    {
        return $this->hasMany(MasterTransaction::class, 'transactionable_id')
            ->where('transactionable_type', MasterTransactionSourceType::CustomerReturn->value);
    }
}
