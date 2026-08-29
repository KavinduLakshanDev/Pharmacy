<?php

namespace App\Models;

use App\Enums\MasterTransactionSourceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class SupplierReturn extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'return_number',
        'supplier_id',
        'grn_id',
        'branch_id',
        'return_date',
        'notes',
        'status',
        'sub_total',
        'total_amount',
        'created_by',
    ];

    protected $casts = [
        'return_date' => 'date',
        'sub_total' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $supplierReturn): void {
            $transactions = $supplierReturn->masterTransactions()->orderByDesc('id')->get();

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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function grn(): BelongsTo
    {
        return $this->belongsTo(Grn::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SupplierReturnItem::class);
    }

    public function masterTransactions(): HasMany
    {
        return $this->hasMany(MasterTransaction::class, 'transactionable_id')
            ->where('transactionable_type', MasterTransactionSourceType::SupplierReturn->value);
    }
}
