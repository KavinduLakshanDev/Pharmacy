<?php

namespace App\Http\Controllers;

use App\Enums\SaleStatus;
use App\Models\SalesTransactionItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesReportController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $status = $request->get('status', SaleStatus::Completed->value);
        $search = $request->get('search', '');

        $costSubquery = DB::table('grn_items')
            ->select('product_id', 'batch_no', DB::raw('MAX(unit_cost_price) as unit_cost_price'))
            ->whereNull('deleted_at')
            ->groupBy('product_id', 'batch_no');

        $items = SalesTransactionItem::query()
            ->join('sales_transactions', 'sales_transactions.id', '=', 'sales_transaction_items.sales_transaction_id')
            ->join('products', 'products.id', '=', 'sales_transaction_items.product_id')
            ->leftJoin('customers', 'customers.id', '=', 'sales_transactions.customer_id')
            ->leftJoinSub($costSubquery, 'costs', function ($join): void {
                $join->on('costs.product_id', '=', 'sales_transaction_items.product_id')
                    ->whereColumn('costs.batch_no', 'sales_transaction_items.batch_no');
            })
            ->where('sales_transactions.created_by', createdBy())
            ->whereNull('sales_transactions.deleted_at')
            ->whereNull('sales_transaction_items.deleted_at')
            ->whereBetween('sales_transactions.sale_date', [$dateFrom, $dateTo])
            ->when($status !== '' && $status !== 'all', fn ($query) => $query->where('sales_transactions.status', $status))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($builder) use ($search): void {
                    $builder->where('sales_transactions.sale_no', 'like', "%{$search}%")
                        ->orWhere('products.name', 'like', "%{$search}%")
                        ->orWhere('customers.name', 'like', "%{$search}%")
                        ->orWhere('sales_transaction_items.batch_no', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('sales_transactions.sale_date')
            ->orderByDesc('sales_transactions.id')
            ->get([
                'sales_transactions.id as sale_id',
                'sales_transactions.sale_no',
                'sales_transactions.sale_date',
                'sales_transactions.status',
                'customers.name as customer_name',
                'products.name as product_name',
                'sales_transaction_items.batch_no',
                'sales_transaction_items.quantity',
                'sales_transaction_items.unit_price',
                'sales_transaction_items.total_price',
                'sales_transaction_items.discount_amount',
                DB::raw('COALESCE(costs.unit_cost_price, 0) as unit_cost_price'),
            ])
            ->map(function ($item): array {
                $quantity = (float) $item->quantity;
                $grossSales = (float) $item->total_price;
                $discount = (float) $item->discount_amount;
                $netSales = $grossSales - $discount;
                $unitCost = (float) $item->unit_cost_price;
                $costAmount = $quantity * $unitCost;
                $profit = $netSales - $costAmount;

                return [
                    'sale_id' => $item->sale_id,
                    'sale_no' => $item->sale_no,
                    'sale_date' => $item->sale_date instanceof Carbon ? $item->sale_date->format('Y-m-d') : (string) $item->sale_date,
                    'status' => (string) $item->status,
                    'customer_name' => $item->customer_name ?? __('Walk-in Customer'),
                    'product_name' => $item->product_name,
                    'batch_no' => $item->batch_no,
                    'quantity' => round($quantity, 2),
                    'unit_price' => round((float) $item->unit_price, 2),
                    'unit_cost_price' => round($unitCost, 2),
                    'gross_sales' => round($grossSales, 2),
                    'discount_amount' => round($discount, 2),
                    'net_sales' => round($netSales, 2),
                    'cost_amount' => round($costAmount, 2),
                    'profit' => round($profit, 2),
                    'margin' => $netSales > 0 ? round(($profit / $netSales) * 100, 2) : 0,
                ];
            });

        $totalSales = $items->sum('net_sales');
        $totalCost = $items->sum('cost_amount');
        $totalProfit = $items->sum('profit');

        $dailyData = $items
            ->groupBy('sale_date')
            ->map(fn ($entries, $period): array => [
                'period' => $period,
                'sales' => round($entries->sum('net_sales'), 2),
                'cost' => round($entries->sum('cost_amount'), 2),
                'profit' => round($entries->sum('profit'), 2),
            ])
            ->values();

        $monthlyData = $items
            ->groupBy(fn (array $entry): string => substr($entry['sale_date'], 0, 7))
            ->map(fn ($entries, $period): array => [
                'period' => $period,
                'sales' => round($entries->sum('net_sales'), 2),
                'cost' => round($entries->sum('cost_amount'), 2),
                'profit' => round($entries->sum('profit'), 2),
            ])
            ->values();

        return Inertia::render('reports/sales-report', [
            'filters' => compact('dateFrom', 'dateTo', 'status', 'search'),
            'statuses' => ['all', ...SaleStatus::values()],
            'summary' => [
                'total_sales' => round($totalSales, 2),
                'total_cost' => round($totalCost, 2),
                'total_profit' => round($totalProfit, 2),
                'profit_margin' => $totalSales > 0 ? round(($totalProfit / $totalSales) * 100, 2) : 0,
                'total_items' => $items->count(),
            ],
            'items' => $items->values(),
            'dailyData' => $dailyData,
            'monthlyData' => $monthlyData,
        ]);
    }
}
