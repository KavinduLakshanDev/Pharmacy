<?php

namespace App\Models;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\ValidationException;

/**
 * Tracks stock movement for products.
 *
 * Each record represents a stock transaction (IN / OUT) tied to a source document
 * (like a GRN, usage note, delivery, etc.) and optionally a stock location.
 *
 * The model calculates line totals, enforces stock not dropping below zero,
 * and keeps previous/current stock values for auditing.
 */
class MasterTransaction extends BaseModel
{
    /** @use HasFactory<\Database\Factories\MasterTransactionFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'transaction_type',
        'transactionable_type',
        'transactionable_id',
        'stock_type',
        'stock_type_id',
        'quantity',
        'unit_price',
        'total_amount',
        'previous_stock',
        'current_stock',
        'reference_number',
        'transaction_date',
        'notes',
        'batch_no',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'transaction_type' => MasterTransactionType::class,
            'transactionable_type' => MasterTransactionSourceType::class,
            'stock_type' => MasterTransactionStockType::class,
            'status' => MasterTransactionStatus::class,
            'transaction_date' => 'datetime',
            'approved_at' => 'datetime',
            'quantity' => 'decimal:4',
            'unit_price' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'previous_stock' => 'decimal:4',
            'current_stock' => 'decimal:4',
        ];
    }

    protected static function booted(): void
    {
        // Compute derived values before saving.
        static::creating(function (self $transaction): void {
            // Line total = quantity × unit price
            $transaction->total_amount = (float) $transaction->quantity * (float) $transaction->unit_price;

            // Determine previous stock in the same stock location scope.
            // If stock_type/stock_type_id is null, it will match all previous transactions for this product.
            $previousStock = static::query()
                ->where('product_id', $transaction->product_id)
                ->where('stock_type', $transaction->stock_type?->value)
                ->where('stock_type_id', $transaction->stock_type_id)
                ->latest('id')
                ->value('current_stock') ?? 0;

            $transaction->previous_stock = $previousStock;

            // Apply IN/OUT direction to calculate the resulting stock.
            $stockChange = $transaction->transaction_type === MasterTransactionType::In
                ? (float) $transaction->quantity
                : -1 * (float) $transaction->quantity;

            $currentStock = $previousStock + $stockChange;

            if ($currentStock < 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Transaction would reduce stock below zero.',
                ]);
            }

            $transaction->current_stock = $currentStock;

            // Auto-generate reference number if not provided.
            if (blank($transaction->reference_number)) {
                $transaction->reference_number = static::generateReferenceNumber(
                    $transaction->transactionable_type ?? MasterTransactionSourceType::Other,
                );
            }
        });

        static::created(function (self $transaction): void {
            static::updateProductStock($transaction->product_id);
        });
    }

    public static function recalculateLedgerForScope(int $productId, ?string $stockType = null, ?int $stockTypeId = null): void
    {
        $transactions = static::query()
            ->where('product_id', $productId)
            ->when(
                $stockType === null,
                static fn ($query) => $query->whereNull('stock_type'),
                static fn ($query) => $query->where('stock_type', $stockType),
            )
            ->when(
                $stockTypeId === null,
                static fn ($query) => $query->whereNull('stock_type_id'),
                static fn ($query) => $query->where('stock_type_id', $stockTypeId),
            )
            ->orderBy('id')
            ->get();

        $runningStock = 0;

        foreach ($transactions as $transaction) {
            $quantity = (float) $transaction->quantity;
            $nextStock = $transaction->transaction_type === MasterTransactionType::In
                ? $runningStock + $quantity
                : $runningStock - $quantity;

            if ($nextStock < 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Transaction sequence would reduce stock below zero.',
                ]);
            }

            $transaction->forceFill([
                'previous_stock' => $runningStock,
                'current_stock' => $nextStock,
                'total_amount' => round($quantity * (float) $transaction->unit_price, 2),
            ])->saveQuietly();

            $runningStock = $nextStock;
        }

        static::updateProductStock($productId);
    }

    protected static function updateProductStock(int $productId): void
    {
        $globalStock = static::query()
            ->where('product_id', $productId)
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN transaction_type = ? THEN quantity ELSE -quantity END), 0) as stock',
                [MasterTransactionType::In->value],
            )
            ->value('stock');

        Product::query()->whereKey($productId)->update(['stock_quantity' => round((float) $globalStock, 4)]);
    }

    public static function generateReferenceNumber(MasterTransactionSourceType $sourceType): string
    {
        $prefix = $sourceType->referencePrefix();

        $lastReference = static::withTrashed()
            ->where('reference_number', 'like', $prefix.'-%')
            ->orderByDesc('id')
            ->value('reference_number');

        $nextNumber = 1;

        if (is_string($lastReference)) {
            $suffix = (int) substr($lastReference, strlen($prefix) + 1);
            $nextNumber = $suffix + 1;
        }

        return $prefix.'-'.str_pad((string) $nextNumber, 6, '0', STR_PAD_LEFT);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function transactionable(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'transactionable_type', 'transactionable_id');
    }

    public function stockLocation(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'stock_type', 'stock_type_id');
    }
}
