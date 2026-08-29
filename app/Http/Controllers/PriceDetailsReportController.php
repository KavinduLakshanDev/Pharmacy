<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PriceDetailsReportController extends Controller
{
    public function index(Request $request): Response
    {
        $branchId = $request->integer('branch_id') ?: null;
        $search = $request->get('search', '');

        $query = Product::query()
            ->leftJoin('grn_items', function ($join): void {
                $join->on('grn_items.product_id', '=', 'products.id')
                    ->whereNull('grn_items.deleted_at');
            })
            ->leftJoin('grns', function ($join): void {
                $join->on('grns.id', '=', 'grn_items.grn_id')
                    ->whereNull('grns.deleted_at');
            })
            ->leftJoin('branches', 'branches.id', '=', 'grns.branch_id')
            ->whereNull('products.deleted_at')
            ->where(function ($builder): void {
                $builder->where('products.created_by', createdBy())
                    ->orWhere('products.assigned_to', auth()->id());
            })
            ->when($branchId, fn ($builder) => $builder->where('grns.branch_id', $branchId))
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($searchQuery) use ($search): void {
                    $searchQuery->where('products.name', 'like', "%{$search}%")
                        ->orWhere('products.sku', 'like', "%{$search}%")
                        ->orWhere('grn_items.batch_no', 'like', "%{$search}%")
                        ->orWhere('grns.batch_no', 'like', "%{$search}%")
                        ->orWhere('grns.grn_no', 'like', "%{$search}%");
                });
            });

        $priceDetails = $query
            ->orderBy('products.name')
            ->orderBy('grn_items.batch_no')
            ->get([
                DB::raw('COALESCE(grn_items.id, products.id) as row_id'),
                'products.id as product_id',
                'products.name as product_name',
                'products.sku',
                'products.price',
                'grns.grn_no',
                'grns.batch_no as grn_batch_no',
                'grn_items.batch_no as item_batch_no',
                'grn_items.unit_price',
                'grn_items.unit_sales_price',
                'grn_items.sale_price',
                'grn_items.unit_stock',
                'grn_items.quantity',
                'grn_items.free_qty',
                'branches.name as branch_name',
            ])
            ->map(function ($item): array {
                $quantity = (float) ($item->quantity ?? 0);
                $freeQuantity = (float) ($item->free_qty ?? 0);

                return [
                    'id' => (int) $item->row_id,
                    'product_id' => (int) $item->product_id,
                    'product_name' => $item->product_name,
                    'sku' => $item->sku,
                    'price' => round((float) $item->price, 2),
                    'batch_no' => $item->item_batch_no ?: $item->grn_batch_no,
                    'grn_no' => $item->grn_no,
                    'branch_name' => $item->branch_name,
                    'unit_price' => round((float) ($item->unit_price ?? 0), 2),
                    'unit_sales_price' => round((float) ($item->unit_sales_price ?? $item->sale_price ?? $item->price), 2),
                    'available_stock' => round((float) ($item->unit_stock ?? ($quantity + $freeQuantity)), 2),
                ];
            });

        return Inertia::render('reports/price-details-report', [
            'filters' => [
                'branchId' => $branchId,
                'search' => $search,
            ],
            'branches' => Branch::query()
                ->where('created_by', createdBy())
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'summary' => [
                'total_items' => $priceDetails->count(),
                'total_products' => $priceDetails->pluck('product_id')->unique()->count(),
                'total_batches' => $priceDetails->pluck('batch_no')->filter()->unique()->count(),
            ],
            'priceDetails' => $priceDetails->values(),
        ]);
    }
}
