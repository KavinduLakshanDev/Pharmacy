<?php

namespace App\Models;

use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use App\Enums\SaleStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class SalesTransaction extends BaseModel
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'sale_no',
        'customer_id',
        'branch_id',
        'sale_date',
        'sub_total',
        'discount_value',
        'discount_amount',
        'discount_type',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'status',
        'payment_method',
        'description',
        'created_by',
        'pos_session_id',
        'finance_account_id',
        'cheque_no',
        'cheque_date',
        'cheque_bank',
        'cheque_branch',
        'issued_by',
        'checked_by',
        'delivery_charge',
        'points_earned',
        'points_redeemed',
        'points_redeemed_amount',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'sub_total' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'delivery_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'status' => SaleStatus::class,
        'finance_account_id' => 'integer',
        'cheque_date' => 'date',
        'points_earned' => 'float',
        'points_redeemed' => 'float',
        'points_redeemed_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesTransactionItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class, 'sales_transaction_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function posSession(): BelongsTo
    {
        return $this->belongsTo(PosSession::class);
    }

    public function financeAccount(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class);
    }

    protected static function booted(): void
    {
        static::created(function (self $sale): void {
            $sale->syncLoyaltyPoints();
        });

        static::updated(function (self $sale): void {
            if (
                $sale->wasChanged([
                    'status',
                    'balance_amount',
                    'customer_id',
                    'paid_amount',
                    'total_amount',
                ])
            ) {
                $sale->syncCustomerBalanceForSaleChange();
            }
            if ($sale->wasChanged(['status', 'customer_id', 'total_amount'])) {
                $sale->syncLoyaltyPoints();
            }
        });

        static::deleted(function (self $sale): void {
            $sale->revertCustomerBalanceForCompletedSale();
            $sale->revertLoyaltyPointsForSale();
        });

        static::restored(function (self $sale): void {
            if ($sale->status === SaleStatus::Completed && $sale->customer_id) {
                $sale->applyDeltaToCustomerById(
                    (int) $sale->customer_id,
                    round(max(0, (float) ($sale->balance_amount ?? 0)), 2),
                );
            }
            $sale->syncLoyaltyPoints();
        });
    }

    /**
     * Recalculate totals based on line items.
     */
    public function calculateTotals(): void
    {
        $subTotal = 0;
        $totalDiscount = 0;

        foreach ($this->items as $item) {
            $lineTotal = $item->total_price;
            $discountAmount = $item->discount_amount ?? 0;

            $subTotal += $lineTotal;
            $totalDiscount += $discountAmount;
        }

        $globalDiscount = 0;
        if ($this->discount_type === 'percentage') {
            $globalDiscount = round(($subTotal * (float) ($this->discount_value ?? 0)) / 100, 2);
        } elseif ($this->discount_type === 'fixed') {
            $globalDiscount = (float) ($this->discount_value ?? 0);
        }

        $totalDiscount += $globalDiscount;

        $pointsRedeemedAmount = (float) ($this->points_redeemed_amount ?? 0);
        $totalAmount = ($subTotal - $totalDiscount - $pointsRedeemedAmount) + ($this->tax_amount ?? 0) + ($this->delivery_charge ?? 0);
        $totalAmount = max(0, $totalAmount);
        $balanceAmount = $totalAmount - ($this->paid_amount ?? 0);

        $this->sub_total = $subTotal;
        $this->discount_amount = $totalDiscount;
        $this->total_amount = $totalAmount;
        $this->balance_amount = max(0, $balanceAmount);

        // Update status based on payment
        if ($this->status !== SaleStatus::Cancelled && $this->status !== SaleStatus::Draft) {
            $newStatus = $this->status;
            if ($this->paid_amount >= $totalAmount) {
                $newStatus = SaleStatus::Completed;
            } elseif ($this->paid_amount > 0) {
                $newStatus = SaleStatus::Partial;
            }

            if ($newStatus !== $this->status) {
                $this->status = $newStatus;
            }
        }

        $this->save();

        $this->syncMasterTransactions();
        $this->syncFinanceTransaction();
        $this->syncLoyaltyPoints();
    }

    /**
     * Sync the sale loyalty points for privileged customers if enabled by super admin.
     */
    protected function syncLoyaltyPoints(): void
    {
        // 1. Revert previous points earned and redeemed by this transaction on the customer
        $oldPointsEarned = (float) ($this->getOriginal('points_earned') ?? 0);
        $oldPointsRedeemed = (float) ($this->getOriginal('points_redeemed') ?? 0);

        $customer = $this->customer;
        if ($customer) {
            $customer->update([
                'points' => round(max(0, (float) $customer->points + $oldPointsRedeemed - $oldPointsEarned), 2),
            ]);
        }

        // If the sale is cancelled or draft, we don't grant nor deduct points.
        if (in_array($this->status, [SaleStatus::Cancelled, SaleStatus::Draft])) {
            if ($this->points_earned > 0 || $this->points_redeemed > 0 || $this->points_redeemed_amount > 0) {
                $this->updateQuietly([
                    'points_earned' => 0,
                    'points_redeemed' => 0,
                    'points_redeemed_amount' => 0,
                ]);
            }

            return;
        }

        // 2. Check if privileged points feature is enabled by Super Admin
        $superAdminId = User::where('type', 'superadmin')->first()?->id;
        $featureEnabled = getSetting('enable_privileged_points', '0', $superAdminId) === '1';

        if (! $featureEnabled || ! $customer || $customer->type !== 'privileged_customer') {
            if ($this->points_earned > 0 || $this->points_redeemed > 0 || $this->points_redeemed_amount > 0) {
                $this->updateQuietly([
                    'points_earned' => 0,
                    'points_redeemed' => 0,
                    'points_redeemed_amount' => 0,
                ]);
            }

            return;
        }

        // 3. Deduct new points redeemed
        $newPointsRedeemed = (float) ($this->points_redeemed ?? 0);
        if ($newPointsRedeemed > 0) {
            $customer->update([
                'points' => round(max(0, (float) $customer->points - $newPointsRedeemed), 2),
            ]);
        }

        // 4. Calculate and award new points earned based on Point Earning Rules for the company/creator
        $companyId = $this->created_by ?? createdBy();
        $calculatedPoints = PointsEarningRule::pointsForBillAmount((float) $this->total_amount, $companyId);

        if ($calculatedPoints !== $this->points_earned) {
            $this->updateQuietly(['points_earned' => $calculatedPoints]);
        }

        if ($calculatedPoints > 0) {
            $customer->update([
                'points' => round((float) $customer->points + $calculatedPoints, 2),
            ]);
        }
    }

    /**
     * Revert loyalty points when a sale is deleted.
     */
    protected function revertLoyaltyPointsForSale(): void
    {
        if ($this->customer_id) {
            $customer = $this->customer;
            if ($customer) {
                $pointsEarned = (float) ($this->points_earned ?? 0);
                $pointsRedeemed = (float) ($this->points_redeemed ?? 0);
                $customer->update([
                    'points' => round(max(0, (float) $customer->points + $pointsRedeemed - $pointsEarned), 2),
                ]);
            }
        }
    }

    /**
     * Sync the sale payment into finance transactions if a bank account is selected.
     */
    protected function syncFinanceTransaction(): void
    {
        // Remove existing finance transactions linked to this sale
        FinanceTransaction::query()
            ->where('reference', $this->sale_no)
            ->where('description', 'like', 'Sale Payment%')
            ->delete();

        // If we have specific split payments, use them.
        // Otherwise fallback to the main model fields for backward compatibility.
        $paymentsToSync = $this->payments()->count() > 0
            ? $this->payments
            : [
                (object) [
                    'payment_method' => $this->payment_method,
                    'finance_account_id' => $this->finance_account_id,
                    'amount' => $this->paid_amount,
                ],
            ];

        foreach ($paymentsToSync as $payment) {
            // Cheque payments do not update finance account immediately
            if ($payment->payment_method === 'cheque') {
                continue;
            }

            if (in_array($this->status, [SaleStatus::Completed, SaleStatus::Partial]) && $payment->finance_account_id && $payment->amount > 0) {
                FinanceTransaction::query()->create([
                    'finance_account_id' => $payment->finance_account_id,
                    'branch_id' => $this->branch_id,
                    'created_by' => $this->created_by,
                    'amount' => $payment->amount,
                    'reference' => $this->sale_no,
                    'description' => "Sale Payment - {$this->sale_no}",
                    'transaction_date' => $this->sale_date ?? now(),
                    'type' => 'credit',
                ]);
            }
        }
    }

    /**
     * Sync the sale items into master transaction records for stock tracking.
     */
    protected function syncMasterTransactions(): void
    {
        // 1. Revert existing stock deductions before updating
        $existingTransactions = MasterTransaction::query()
            ->where('transactionable_type', MasterTransactionSourceType::Sale)
            ->where('transactionable_id', $this->id)
            ->get();

        foreach ($existingTransactions as $transaction) {
            $grnItem = GrnItem::where('grn_items.product_id', $transaction->product_id)
                ->where('grn_items.batch_no', $transaction->batch_no)
                ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                ->where('grns.branch_id', $this->branch_id)
                ->select('grn_items.*')
                ->first();

            if ($grnItem && $transaction->status === MasterTransactionStatus::Completed->value) {
                // Since this was an 'Out' transaction, we add it back (increment)
                // We need to convert from stocking units (boxes) back to sales units (tablets)
                $packSize = $grnItem->pack_size ?: 1;
                $grnItem->increment('unit_stock', $transaction->quantity * $packSize);
            }
        }

        // 2. Remove existing transactions
        MasterTransaction::query()
            ->where('transactionable_type', MasterTransactionSourceType::Sale)
            ->where('transactionable_id', $this->id)
            ->forceDelete();

        $transactionStatus = in_array($this->status, [SaleStatus::Completed, SaleStatus::Partial])
            ? MasterTransactionStatus::Completed
            : MasterTransactionStatus::Pending;

        foreach ($this->items as $index => $item) {
            // Find the corresponding GRN item to get pack_size and update its stock
            $grnItem = GrnItem::where('grn_items.product_id', $item->product_id)
                ->where('grn_items.batch_no', $item->batch_no)
                ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
                ->where('grns.branch_id', $this->branch_id)
                ->select('grn_items.*')
                ->first();

            $packSize = $grnItem?->pack_size ?: 1;

            // Convert sale units (tablets) to stocking units (boxes) for MasterTransaction
            // because the report multiplies by pack_size.
            $stockingQuantity = (float) $item->quantity / (float) $packSize;

            MasterTransaction::query()->create([
                'product_id' => $item->product_id,
                'transaction_type' => MasterTransactionType::Out,
                'transactionable_type' => MasterTransactionSourceType::Sale,
                'transactionable_id' => $this->id,
                'stock_type' => MasterTransactionStockType::Branch,
                'stock_type_id' => $this->branch_id,
                'quantity' => $stockingQuantity,
                'unit_price' => $item->unit_price,
                'status' => $transactionStatus,
                'reference_number' => sprintf('%s-%02d', $this->sale_no, $index + 1),
                'batch_no' => $item->batch_no,
                'created_by' => $this->created_by,
            ]);

            // Decrement the unit_stock in grn_items if the sale is completed or partial
            if (in_array($this->status, [SaleStatus::Completed, SaleStatus::Partial]) && $grnItem) {
                $grnItem->decrement('unit_stock', $item->quantity);
            }
        }
    }

    protected function syncCustomerBalanceForSaleChange(): void
    {
        $oldCustomerId = $this->getOriginal('customer_id');
        $newCustomerId = $this->customer_id;

        $oldStatus = $this->normalizeSaleStatusValue($this->getOriginal('status'));
        $newStatus = $this->normalizeSaleStatusValue($this->status);

        $oldBalanceAmount = (float) ($this->getOriginal('balance_amount') ?? 0);
        $newBalanceAmount = (float) ($this->balance_amount ?? 0);

        $oldPortion = $this->outstandingAppliedToCustomer($oldStatus, $oldBalanceAmount);
        $newPortion = $this->outstandingAppliedToCustomer($newStatus, $newBalanceAmount);

        if ((int) $oldCustomerId !== (int) $newCustomerId) {
            if ($oldCustomerId) {
                $this->applyDeltaToCustomerById((int) $oldCustomerId, -$oldPortion);
            }
            if ($newCustomerId) {
                $this->applyDeltaToCustomerById((int) $newCustomerId, $newPortion);
            }

            return;
        }

        if (! $newCustomerId) {
            return;
        }

        $delta = round($newPortion - $oldPortion, 2);

        if (abs($delta) < 0.0001) {
            return;
        }

        $this->applyDeltaToCustomerById((int) $newCustomerId, $delta);
    }

    protected function revertCustomerBalanceForCompletedSale(): void
    {
        if (! $this->customer_id || ! in_array($this->status, [SaleStatus::Completed->value, SaleStatus::Partial->value])) {
            return;
        }

        $amount = round(max(0, (float) ($this->balance_amount ?? 0)), 2);

        if ($amount < 0.0001) {
            return;
        }

        $this->applyDeltaToCustomerById((int) $this->customer_id, -$amount);
    }

    /**
     * @param  string|\App\Enums\SaleStatus|null  $status
     */
    private function normalizeSaleStatusValue(mixed $status): string
    {
        if ($status instanceof SaleStatus) {
            return $status->value;
        }

        return (string) $status;
    }

    private function outstandingAppliedToCustomer(string $status, float $balanceAmount): float
    {
        if (! in_array($status, [SaleStatus::Completed->value, SaleStatus::Partial->value])) {
            return 0.0;
        }

        return round(max(0, $balanceAmount), 2);
    }

    private function applyDeltaToCustomerById(int $customerId, float $delta): void
    {
        if ($customerId === 0 || abs($delta) < 0.0001) {
            return;
        }

        DB::transaction(function () use ($customerId, $delta): void {
            $customer = Customer::query()->lockForUpdate()->find($customerId);

            if (! $customer || str_contains(strtolower((string) $customer->name), 'walk-in')) {
                return;
            }

            $customer->update([
                'current_balance' => max(0, (float) ($customer->current_balance ?? 0) + $delta),
            ]);
        });
    }
}
