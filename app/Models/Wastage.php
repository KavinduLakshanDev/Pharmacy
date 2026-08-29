<?php

namespace App\Models;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\WastageStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class Wastage extends BaseModel
{
    /** @use HasFactory<\Database\Factories\WastageFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'wastage_no',
        'branch_id',
        'wastage_date',
        'total_amount',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'wastage_date' => 'date',
            'total_amount' => 'decimal:2',
            'status' => WastageStatus::class,
            'approved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (self $wastage): void {
            if ($wastage->isForceDeleting()) {
                $wastage->items()->withTrashed()->forceDelete();
                $wastage->masterTransactions()->withTrashed()->forceDelete();

                return;
            }

            $wastage->items()->delete();
            $wastage->deleteMasterTransactions();
        });
    }

    public static function generateWastageNo(): string
    {
        $prefix = MasterTransactionSourceType::Wastage->referencePrefix();

        $last = static::withTrashed()
            ->where('wastage_no', 'like', $prefix.'-%')
            ->orderByDesc('id')
            ->value('wastage_no');

        $next = 1;

        if (is_string($last) && preg_match('/^'.preg_quote($prefix, '/').'-([0-9]{6})$/', $last, $matches)) {
            $next = (int) $matches[1] + 1;
        }

        return $prefix.'-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    public function approve(?int $approvedBy = null): void
    {
        if ($this->status === WastageStatus::Approved) {
            throw ValidationException::withMessages([
                'status' => 'Wastage is already approved.',
            ]);
        }

        if ($this->masterTransactions()->exists()) {
            throw ValidationException::withMessages([
                'status' => 'Wastage already has stock transactions.',
            ]);
        }

        $this->loadMissing('items');

        if ($this->items->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Wastage must contain at least one item before approval.',
            ]);
        }

        $approvedUserId = $approvedBy ?? auth()->id() ?? $this->created_by;

        DB::transaction(function () use ($approvedUserId): void {
            foreach ($this->items as $item) {
                $transactionDate = $this->wastage_date?->copy()->setTimeFrom(now()) ?? now();
                $notes = $this->notes ?: "Wastage {$this->wastage_no}";

                MasterTransaction::query()->create([
                    'product_id' => $item->product_id,
                    'transaction_type' => MasterTransactionType::Out,
                    'transactionable_type' => MasterTransactionSourceType::Wastage,
                    'transactionable_id' => $this->id,
                    'stock_type' => $this->branch_id ? MasterTransactionStockType::Branch : null,
                    'stock_type_id' => $this->branch_id,
                    'batch_no' => $item->batch_no,
                    'quantity' => round((float) $item->quantity, 4),
                    'unit_price' => $item->unit_price,
                    'transaction_date' => $transactionDate,
                    'notes' => $notes,
                    'status' => MasterTransactionStatus::Completed,
                    'created_by' => $this->created_by,
                    'approved_by' => $approvedUserId,
                    'approved_at' => now(),
                ]);
            }

            $this->update([
                'status' => WastageStatus::Approved,
                'approved_by' => $approvedUserId,
                'approved_at' => now(),
            ]);
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(WastageItem::class);
    }

    public function masterTransactions(): HasMany
    {
        return $this->hasMany(MasterTransaction::class, 'transactionable_id')
            ->where('transactionable_type', MasterTransactionSourceType::Wastage->value);
    }

    protected function deleteMasterTransactions(): void
    {
        $transactions = $this->masterTransactions()->orderByDesc('id')->get();

        if ($transactions->isEmpty()) {
            return;
        }

        $transactionsByScope = $transactions->groupBy(function (MasterTransaction $transaction): string {
            $stockType = $transaction->getRawOriginal('stock_type') ?? 'null';
            $stockTypeId = $transaction->stock_type_id ?? 'null';

            return "{$transaction->product_id}:{$stockType}:{$stockTypeId}";
        });

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
    }
}
