<?php

namespace App\Models;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\StockTransferStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockTransfer extends BaseModel
{
    /** @use HasFactory<\Database\Factories\StockTransferFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'transfer_no',
        'from_branch_id',
        'to_branch_id',
        'transfer_date',
        'total_amount',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'accepted_by',
        'accepted_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'transfer_date' => 'date',
            'total_amount' => 'decimal:2',
            'status' => StockTransferStatus::class,
            'approved_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (self $transfer): void {
            if ($transfer->isForceDeleting()) {
                $transfer->items()->withTrashed()->forceDelete();
                $transfer->masterTransactions()->withTrashed()->forceDelete();

                return;
            }

            $transfer->items()->delete();
            $transfer->deleteMasterTransactions();
        });
    }

    public static function generateTransferNo(): string
    {
        $prefix = 'ST';

        $last = static::withTrashed()
            ->where('transfer_no', 'like', $prefix.'-%')
            ->orderByDesc('id')
            ->value('transfer_no');

        $next = 1;

        if (is_string($last) && preg_match('/^'.preg_quote($prefix, '/').'-([0-9]{6})$/', $last, $matches)) {
            $next = (int) $matches[1] + 1;
        }

        return $prefix.'-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    public function approve(?int $approvedBy = null): void
    {
        if ($this->status !== StockTransferStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => 'Only pending stock transfers can be approved.',
            ]);
        }

        $approvedUserId = $approvedBy ?? auth()->id() ?? $this->created_by;

        DB::transaction(function () use ($approvedUserId): void {
            static::query()->whereKey($this->id)->lockForUpdate()->firstOrFail();

            $this->refresh();

            if ($this->status !== StockTransferStatus::Pending) {
                throw ValidationException::withMessages([
                    'status' => 'Only pending stock transfers can be approved.',
                ]);
            }

            $this->loadMissing('items');

            if ($this->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'Stock transfer must contain at least one item before approval.',
                ]);
            }

            $expectedOutCount = $this->items->count();
            $existingOutCount = $this->masterTransactions()
                ->where('transaction_type', MasterTransactionType::Out)
                ->count();

            if ($existingOutCount === 0) {
                foreach ($this->items as $item) {
                    $stockingQuantity = round((float) $item->quantity, 4);
                    $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $item->batch_no);
                    $tabletQuantity = $this->tabletQuantityForTransferLine($item, $sourceGrnItem, $stockingQuantity);

                    if ($sourceGrnItem !== null && $tabletQuantity > 0 && (float) ($sourceGrnItem->unit_stock ?? 0) < $tabletQuantity) {
                        throw ValidationException::withMessages([
                            'items' => __('Insufficient recorded batch stock at the source branch for batch :batch.', [
                                'batch' => (string) $item->batch_no,
                            ]),
                        ]);
                    }

                    $transactionDate = $this->transfer_date?->copy()->setTimeFrom(now()) ?? now();
                    $notes = $this->notes ?: "Stock Transfer {$this->transfer_no}";
                    $costPrice = $this->resolveTransferCostPricePerBox($item, $sourceGrnItem);

                    MasterTransaction::query()->create([
                        'product_id' => $item->product_id,
                        'transaction_type' => MasterTransactionType::Out,
                        'transactionable_type' => MasterTransactionSourceType::StockTransfer,
                        'transactionable_id' => $this->id,
                        'stock_type' => MasterTransactionStockType::Branch,
                        'stock_type_id' => $this->from_branch_id,
                        'batch_no' => $item->batch_no,
                        'quantity' => $stockingQuantity,
                        'unit_price' => $costPrice,
                        'transaction_date' => $transactionDate,
                        'notes' => $notes,
                        'status' => MasterTransactionStatus::Completed,
                        'created_by' => $this->created_by,
                        'approved_by' => $approvedUserId,
                        'approved_at' => now(),
                    ]);

                    $this->decrementSourceGrnUnitStockForTransfer($item, $tabletQuantity, $sourceGrnItem);
                }
            } elseif ($existingOutCount !== $expectedOutCount) {
                throw ValidationException::withMessages([
                    'status' => __('This transfer has ledger rows that do not match its line items. Cannot approve.'),
                ]);
            }

            $this->update([
                'status' => StockTransferStatus::Approved,
                'approved_by' => $approvedUserId,
                'approved_at' => now(),
            ]);
        });
    }

    public function accept(?int $acceptedBy = null): void
    {
        $acceptedUserId = $acceptedBy ?? auth()->id() ?? $this->created_by;

        DB::transaction(function () use ($acceptedUserId): void {
            static::query()->whereKey($this->id)->lockForUpdate()->firstOrFail();

            $this->refresh();

            if ($this->status !== StockTransferStatus::Approved) {
                throw ValidationException::withMessages([
                    'status' => __('Only approved stock transfers can be accepted.'),
                ]);
            }

            $this->loadMissing('items');

            if ($this->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => __('Stock transfer must contain at least one item.'),
                ]);
            }

            $expectedTxnCount = $this->items->count() * 2;
            $existingTxnCount = $this->masterTransactions()->count();

            if ($existingTxnCount > 0) {
                if ($existingTxnCount === $expectedTxnCount && $expectedTxnCount > 0) {
                    $this->finalizeAcceptanceWorkflow($acceptedUserId);

                    return;
                }

                if ($existingTxnCount === $this->items->count()) {
                    $existingOutCount = $this->masterTransactions()
                        ->where('transaction_type', MasterTransactionType::Out)
                        ->count();

                    if ($existingOutCount !== $this->items->count()) {
                        throw ValidationException::withMessages([
                            'status' => __('This transfer has ledger rows that do not match its line items. Cannot accept.'),
                        ]);
                    }

                    foreach ($this->items as $item) {
                        $transactionDate = $this->transfer_date?->copy()->setTimeFrom(now()) ?? now();
                        $notes = $this->notes ?: "Stock Transfer {$this->transfer_no}";
                        $stockingQuantity = round((float) $item->quantity, 4);
                        $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $item->batch_no);
                        $costPrice = $this->resolveTransferCostPricePerBox($item, $sourceGrnItem);
                        $tabletQuantity = $this->tabletQuantityForTransferLine($item, $sourceGrnItem, $stockingQuantity);

                        MasterTransaction::query()->create([
                            'product_id' => $item->product_id,
                            'transaction_type' => MasterTransactionType::In,
                            'transactionable_type' => MasterTransactionSourceType::StockTransfer,
                            'transactionable_id' => $this->id,
                            'stock_type' => MasterTransactionStockType::Branch,
                            'stock_type_id' => $this->to_branch_id,
                            'batch_no' => $item->batch_no,
                            'quantity' => $stockingQuantity,
                            'unit_price' => $costPrice,
                            'transaction_date' => $transactionDate,
                            'notes' => $notes,
                            'status' => MasterTransactionStatus::Completed,
                            'created_by' => $this->created_by,
                            'approved_by' => $acceptedUserId,
                            'approved_at' => now(),
                        ]);

                        $this->incrementDestinationGrnUnitStockForTransfer($item, $tabletQuantity);
                    }

                    $this->finalizeAcceptanceWorkflow($acceptedUserId);

                    return;
                }

                throw ValidationException::withMessages([
                    'status' => __('This transfer has ledger rows that do not match its line items. Cannot accept.'),
                ]);
            }

            foreach ($this->items as $item) {
                $transactionDate = $this->transfer_date?->copy()->setTimeFrom(now()) ?? now();
                $notes = $this->notes ?: "Stock Transfer {$this->transfer_no}";
                $stockingQuantity = round((float) $item->quantity, 4);

                $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $item->batch_no);

                $costPrice = $this->resolveTransferCostPricePerBox($item, $sourceGrnItem);

                $tabletQuantity = $this->tabletQuantityForTransferLine($item, $sourceGrnItem, $stockingQuantity);

                MasterTransaction::query()->create([
                    'product_id' => $item->product_id,
                    'transaction_type' => MasterTransactionType::In,
                    'transactionable_type' => MasterTransactionSourceType::StockTransfer,
                    'transactionable_id' => $this->id,
                    'stock_type' => MasterTransactionStockType::Branch,
                    'stock_type_id' => $this->to_branch_id,
                    'batch_no' => $item->batch_no,
                    'quantity' => $stockingQuantity,
                    'unit_price' => $costPrice,
                    'transaction_date' => $transactionDate,
                    'notes' => $notes,
                    'status' => MasterTransactionStatus::Completed,
                    'created_by' => $this->created_by,
                    'approved_by' => $acceptedUserId,
                    'approved_at' => now(),
                ]);

                $this->incrementDestinationGrnUnitStockForTransfer($item, $tabletQuantity);
            }

            $this->finalizeAcceptanceWorkflow($acceptedUserId);
        });
    }

    public function reject(string $reason, ?int $rejectedBy = null): void
    {
        $rejectedUserId = $rejectedBy ?? auth()->id() ?? $this->created_by;

        DB::transaction(function () use ($reason, $rejectedUserId): void {
            static::query()->whereKey($this->id)->lockForUpdate()->firstOrFail();

            $this->refresh();

            if ($this->status !== StockTransferStatus::Approved) {
                throw ValidationException::withMessages([
                    'status' => __('Only approved stock transfers can be rejected.'),
                ]);
            }

            $this->loadMissing('items');

            if ($this->masterTransactions()->exists()) {
                $outCount = $this->masterTransactions()
                    ->where('transaction_type', MasterTransactionType::Out)
                    ->count();
                $inCount = $this->masterTransactions()
                    ->where('transaction_type', MasterTransactionType::In)
                    ->count();

                if ($inCount === 0 && $outCount === $this->items->count()) {
                    foreach ($this->items as $item) {
                        $stockingQuantity = round((float) $item->quantity, 4);
                        $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $item->batch_no);
                        $tabletQuantity = $this->tabletQuantityForTransferLine($item, $sourceGrnItem, $stockingQuantity);
                        $this->restoreSourceGrnUnitStockForApproval($item, $tabletQuantity);
                    }

                    $this->deleteMasterTransactions();
                } else {
                    foreach ($this->items as $item) {
                        $stockingQuantity = round((float) $item->quantity, 4);
                        $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $item->batch_no);
                        $tabletQuantity = $this->tabletQuantityForTransferLine($item, $sourceGrnItem, $stockingQuantity);
                        $this->reverseGrnUnitStockForRejectAfterPostings($item, $tabletQuantity);
                    }

                    $this->deleteMasterTransactions();
                }
            } else {
                foreach ($this->items as $item) {
                    $stockingQuantity = round((float) $item->quantity, 4);
                    $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $item->batch_no);
                    $tabletQuantity = $this->tabletQuantityForTransferLine($item, $sourceGrnItem, $stockingQuantity);
                    $this->restoreSourceGrnUnitStockForApproval($item, $tabletQuantity);
                }
            }

            $this->update([
                'status' => StockTransferStatus::Rejected,
                'rejected_by' => $rejectedUserId,
                'rejected_at' => now(),
                'rejection_reason' => $reason,
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

    public function accepter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function fromBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    /**
     * Both OUT and IN transactions share the same transactionable_id
     * and transactionable_type, so we return all of them here.
     */
    public function masterTransactions(): HasMany
    {
        return $this->hasMany(MasterTransaction::class, 'transactionable_id')
            ->where('transactionable_type', MasterTransactionSourceType::StockTransfer->value);
    }

    protected function finalizeAcceptanceWorkflow(int $acceptedUserId): void
    {
        $this->update([
            'status' => StockTransferStatus::Accepted,
            'accepted_by' => $acceptedUserId,
            'accepted_at' => now(),
        ]);
    }

    protected function lockedGrnItemForBranchBatch(int $branchId, int $productId, ?string $batchNo): ?GrnItem
    {
        if ($batchNo === null || trim((string) $batchNo) === '') {
            return null;
        }

        $trimmedBatch = trim((string) $batchNo);

        return GrnItem::query()
            ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
            ->where('grns.branch_id', $branchId)
            ->where('grn_items.product_id', $productId)
            ->where('grn_items.batch_no', $trimmedBatch)
            ->select('grn_items.*')
            ->lockForUpdate()
            ->orderByDesc('grn_items.id')
            ->first();
    }

    protected function resolveTransferCostPricePerBox(StockTransferItem $item, ?GrnItem $sourceBranchGrnItem): float
    {
        if ($sourceBranchGrnItem !== null && $sourceBranchGrnItem->new_cost_price !== null) {
            return (float) $sourceBranchGrnItem->new_cost_price;
        }

        $fallbackQuery = GrnItem::query()
            ->where('product_id', $item->product_id)
            ->whereNotNull('new_cost_price');

        if ($item->batch_no !== null && trim((string) $item->batch_no) !== '') {
            $fallbackQuery->where('batch_no', trim((string) $item->batch_no));
        } else {
            $fallbackQuery->whereNull('batch_no');
        }

        $fallback = $fallbackQuery->orderByDesc('id')->first();

        if ($fallback?->new_cost_price !== null) {
            return (float) $fallback->new_cost_price;
        }

        return (float) $item->unit_price;
    }

    /**
     * Lines store quantity in stocking units (e.g. boxes); GRN unit_stock is tracked in base units (e.g. tablets).
     */
    protected function tabletQuantityForTransferLine(StockTransferItem $item, ?GrnItem $sourceGrnItem, float $stockingQuantity): float
    {
        $packSize = 1.0;
        if ($sourceGrnItem !== null && $sourceGrnItem->pack_size !== null && (float) $sourceGrnItem->pack_size > 0) {
            $packSize = (float) $sourceGrnItem->pack_size;
        } else {
            $productPack = Product::query()->whereKey($item->product_id)->value('pack_size');
            if ($productPack !== null && (float) $productPack > 0) {
                $packSize = (float) $productPack;
            }
        }

        return round($stockingQuantity * $packSize, 4);
    }

    protected function decrementSourceGrnUnitStockForTransfer(StockTransferItem $item, float $tabletQuantity, ?GrnItem $sourceGrnItem): void
    {
        if ($tabletQuantity <= 0) {
            return;
        }

        if ($item->batch_no === null || trim((string) $item->batch_no) === '') {
            return;
        }

        if ($sourceGrnItem !== null) {
            $sourceGrnItem->decrement('unit_stock', $tabletQuantity);
        }
    }

    protected function incrementDestinationGrnUnitStockForTransfer(StockTransferItem $item, float $tabletQuantity): void
    {
        if ($tabletQuantity <= 0) {
            return;
        }

        if ($item->batch_no === null || trim((string) $item->batch_no) === '') {
            return;
        }

        $trimmedBatch = trim((string) $item->batch_no);
        $destGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->to_branch_id, (int) $item->product_id, $trimmedBatch);

        if ($destGrnItem !== null) {
            $destGrnItem->increment('unit_stock', $tabletQuantity);
        }
    }

    protected function restoreSourceGrnUnitStockForApproval(StockTransferItem $item, float $tabletQuantity): void
    {
        if ($tabletQuantity <= 0) {
            return;
        }

        if ($item->batch_no === null || trim((string) $item->batch_no) === '') {
            return;
        }

        $trimmedBatch = trim((string) $item->batch_no);
        $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $trimmedBatch);

        if ($sourceGrnItem !== null) {
            $sourceGrnItem->increment('unit_stock', $tabletQuantity);
        }
    }

    protected function syncGrnUnitStockForTransferredBatch(StockTransferItem $item, float $tabletQuantity, ?GrnItem $sourceGrnItem): void
    {
        if ($tabletQuantity <= 0) {
            return;
        }

        if ($item->batch_no === null || trim((string) $item->batch_no) === '') {
            return;
        }

        $trimmedBatch = trim((string) $item->batch_no);

        if ($sourceGrnItem !== null) {
            $sourceGrnItem->decrement('unit_stock', $tabletQuantity);
        }

        $destGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->to_branch_id, (int) $item->product_id, $trimmedBatch);

        if ($destGrnItem !== null) {
            $destGrnItem->increment('unit_stock', $tabletQuantity);
        }
    }

    /**
     * Undo GRN batch unit_stock changes that were applied when transfer postings were created.
     */
    protected function reverseGrnUnitStockForRejectAfterPostings(StockTransferItem $item, float $tabletQuantity): void
    {
        if ($tabletQuantity <= 0 || $item->batch_no === null || trim((string) $item->batch_no) === '') {
            return;
        }

        $trimmedBatch = trim((string) $item->batch_no);

        $sourceGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->from_branch_id, (int) $item->product_id, $trimmedBatch);
        if ($sourceGrnItem !== null) {
            $sourceGrnItem->increment('unit_stock', $tabletQuantity);
        }

        $destGrnItem = $this->lockedGrnItemForBranchBatch((int) $this->to_branch_id, (int) $item->product_id, $trimmedBatch);

        if ($destGrnItem !== null && (float) $destGrnItem->unit_stock < $tabletQuantity) {
            throw ValidationException::withMessages([
                'items' => __('Cannot reject transfer: recorded destination batch quantity is inconsistent.'),
            ]);
        }

        if ($destGrnItem !== null) {
            $destGrnItem->decrement('unit_stock', $tabletQuantity);
        }
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
