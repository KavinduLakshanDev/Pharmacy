<?php

namespace App\Models;

use App\Enums\GrnStatus;
use App\Enums\MasterTransactionSourceType;
use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionStockType;
use App\Enums\MasterTransactionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Grn extends BaseModel
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'grn_no',
        'batch_no',
        'invoice_no',
        'sup_id',
        'branch_id',
        'created_by',
        'grn_date',
        'sub_total',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'description',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'grn_date' => 'date',
        'sub_total' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'status' => GrnStatus::class,
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'sup_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(GrnItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
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

        $totalAmount = $subTotal - $totalDiscount;

        $this->update([
            'sub_total' => $subTotal,
            'discount_amount' => $totalDiscount,
            'total_amount' => $totalAmount,
        ]);

        $this->syncMasterTransactions();
    }

    /**
     * Sync the GRN items into master transaction records for stock tracking.
     */
    protected function syncMasterTransactions(): void
    {
        // Remove any existing transactions for this GRN (e.g. if it's being updated).
        // Use force delete so the unique `reference_number` constraint can be re-used.
        MasterTransaction::query()
            ->where('transactionable_type', MasterTransactionSourceType::Grn)
            ->where('transactionable_id', $this->id)
            ->forceDelete();

        $headOfficeBranch = Branch::query()
            ->where('created_by', $this->created_by)
            ->where('name', 'Head Office')
            ->first();

        $stockTypeId = $this->branch_id ?? $headOfficeBranch?->id;

        $transactionStatus = $this->status === GrnStatus::Approved
            ? MasterTransactionStatus::Completed
            : MasterTransactionStatus::Pending;

        foreach ($this->items as $index => $item) {
            $transactionQuantity = (float) $item->quantity + (float) ($item->free_qty ?? 0);
            $transactionUnitPrice = $item->new_cost_price !== null
                ? (float) $item->new_cost_price
                : (float) $item->unit_price;

            MasterTransaction::query()->create([
                'product_id' => $item->product_id,
                'transaction_type' => MasterTransactionType::In,
                'transactionable_type' => MasterTransactionSourceType::Grn,
                'transactionable_id' => $this->id,
                'stock_type' => MasterTransactionStockType::Branch,
                'stock_type_id' => $stockTypeId,
                'quantity' => $transactionQuantity,
                'unit_price' => $transactionUnitPrice,
                'status' => $transactionStatus,
                'reference_number' => sprintf('%s-%02d', $this->grn_no, $index + 1),
                'batch_no' => $item->batch_no,
                'created_by' => $this->created_by,
            ]);
        }
    }
}
