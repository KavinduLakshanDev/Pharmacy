<?php

namespace App\Http\Controllers;

use App\Enums\StockTransferStatus;
use App\Models\Branch;
use App\Models\Product;
use App\Models\StockTransferItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovedStockTransferReportController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $branchId = $request->get('branch_id', 'all');
        $productId = $request->get('product_id', 'all');
        $transferNo = trim((string) $request->get('transfer_no', ''));
        $batchNo = trim((string) $request->get('batch_no', ''));

        $items = StockTransferItem::query()
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->join('products', 'products.id', '=', 'stock_transfer_items.product_id')
            ->join('branches as from_b', 'from_b.id', '=', 'stock_transfers.from_branch_id')
            ->join('branches as to_b', 'to_b.id', '=', 'stock_transfers.to_branch_id')
            ->where('stock_transfers.created_by', createdBy())
            ->whereNull('stock_transfers.deleted_at')
            ->whereNull('stock_transfer_items.deleted_at')
            ->where('stock_transfers.status', StockTransferStatus::Approved)
            ->whereBetween('stock_transfers.transfer_date', [$dateFrom, $dateTo])
            ->when($branchId !== 'all', function ($query) use ($branchId): void {
                $query->where(function ($builder) use ($branchId): void {
                    $builder->where('stock_transfers.from_branch_id', $branchId)
                        ->orWhere('stock_transfers.to_branch_id', $branchId);
                });
            })
            ->when($productId !== 'all', fn ($query) => $query->where('stock_transfer_items.product_id', $productId))
            ->when($transferNo !== '', fn ($query) => $query->where('stock_transfers.transfer_no', 'like', "%{$transferNo}%"))
            ->when($batchNo !== '', fn ($query) => $query->where('stock_transfer_items.batch_no', 'like', "%{$batchNo}%"))
            ->orderByDesc('stock_transfers.transfer_date')
            ->orderByDesc('stock_transfers.id')
            ->get([
                'stock_transfers.id as transfer_id',
                'stock_transfers.transfer_no',
                'stock_transfers.transfer_date',
                'stock_transfer_items.product_id',
                'products.name as product_name',
                'stock_transfer_items.batch_no',
                'stock_transfer_items.quantity',
                'stock_transfer_items.unit_cost_price',
                'from_b.name as from_branch_name',
                'to_b.name as to_branch_name',
            ])
            ->map(function ($item): array {
                $quantity = (float) $item->quantity;
                $unitCost = $item->unit_cost_price !== null ? (float) $item->unit_cost_price : 0.0;

                return [
                    'transfer_id' => $item->transfer_id,
                    'transfer_no' => $item->transfer_no,
                    'transfer_date' => $item->transfer_date instanceof Carbon ? $item->transfer_date->format('Y-m-d') : (string) $item->transfer_date,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'batch_no' => $item->batch_no,
                    'quantity' => round($quantity, 4),
                    'unit_cost_price' => round($unitCost, 4),
                    'total_cost' => round($quantity * $unitCost, 4),
                    'from_branch_name' => $item->from_branch_name,
                    'to_branch_name' => $item->to_branch_name,
                ];
            })
            ->values();

        $branches = Branch::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $products = Product::query()
            ->where('created_by', createdBy())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('reports/approved-stock-transfer-report', [
            'filters' => compact('dateFrom', 'dateTo', 'branchId', 'productId', 'transferNo', 'batchNo'),
            'branches' => $branches,
            'products' => $products,
            'items' => $items,
            'summary' => [
                'total_items' => $items->count(),
                'total_quantity' => round($items->sum('quantity'), 4),
                'total_cost' => round($items->sum('total_cost'), 4),
            ],
        ]);
    }
}
