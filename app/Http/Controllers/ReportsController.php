<?php

namespace App\Http\Controllers;

use App\Enums\SaleStatus;
use App\Models\Contact;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\Product;
use App\Models\Project;
use App\Models\SalesOrder;
use App\Models\SalesTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function leads(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));

        $companyId = Auth::user()->creatorId();

        $summary = [
            'total_leads' => Lead::where('created_by', $companyId)->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'converted_leads' => Lead::where('created_by', $companyId)->whereBetween('created_at', [$dateFrom, $dateTo])->where('is_converted', true)->count(),
            'conversion_rate' => 0,
            'avg_conversion_time' => 0,
        ];

        if ($summary['total_leads'] > 0) {
            $summary['conversion_rate'] = ($summary['converted_leads'] / $summary['total_leads']) * 100;
        }

        // Calculate average conversion time for converted leads
        if ($summary['converted_leads'] > 0) {
            $avgConversionTime = Lead::where('created_by', $companyId)
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('is_converted', true)
                ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avg_days')
                ->value('avg_days');
            $summary['avg_conversion_time'] = round($avgConversionTime ?? 0, 1);
        }

        $monthlyData = Lead::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, COUNT(*) as count')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = Lead::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, COUNT(*) as count')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $leadsBySource = Lead::selectRaw('lead_sources.name, COUNT(*) as total')
            ->join('lead_sources', 'leads.lead_source_id', '=', 'lead_sources.id')
            ->where('leads.created_by', $companyId)
            ->whereBetween('leads.created_at', [$dateFrom, $dateTo])
            ->groupBy('lead_sources.name')
            ->get();

        return Inertia::render('reports/lead-reports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'leadsBySource' => $leadsBySource,
        ]);
    }

    public function sales(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $companyId = Auth::user()->creatorId();

        $summary = [
            'total_sales' => SalesOrder::where('created_by', $companyId)->whereBetween('created_at', [$dateFrom, $dateTo])->sum('total_amount'),
            'total_orders' => SalesOrder::where('created_by', $companyId)->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'avg_order_value' => 0,
            'growth_rate' => 0,
        ];

        if ($summary['total_orders'] > 0) {
            $summary['avg_order_value'] = $summary['total_sales'] / $summary['total_orders'];
        }

        // Calculate growth rate compared to previous period
        $previousPeriodStart = Carbon::parse($dateFrom)->subDays(Carbon::parse($dateTo)->diffInDays(Carbon::parse($dateFrom)))->format('Y-m-d');
        $previousPeriodEnd = Carbon::parse($dateFrom)->subDay()->format('Y-m-d');

        $previousSales = SalesOrder::where('created_by', $companyId)->whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])->sum('total_amount');

        if ($previousSales > 0) {
            $summary['growth_rate'] = (($summary['total_sales'] - $previousSales) / $previousSales) * 100;
        } elseif ($summary['total_sales'] > 0) {
            $summary['growth_rate'] = 100; // 100% growth if no previous sales
        }

        $monthlyData = SalesOrder::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = SalesOrder::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $salesByStatus = SalesOrder::selectRaw('status, COUNT(*) as total, SUM(total_amount) as amount')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('status')
            ->get();

        return Inertia::render('reports/sales-reports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'salesByStatus' => $salesByStatus,
        ]);
    }

    public function products(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $companyId = Auth::user()->creatorId();

        $summary = [
            'total_products' => Product::where('created_by', $companyId)->count(),
            'active_products' => Product::where('created_by', $companyId)->where('status', 'active')->count(),
            'total_revenue' => 0,
            'best_seller' => null,
        ];

        $productSales = DB::table('sales_order_products')
            ->join('sales_orders', 'sales_order_products.sales_order_id', '=', 'sales_orders.id')
            ->join('products', 'sales_order_products.product_id', '=', 'products.id')
            ->selectRaw('products.name, SUM(sales_order_products.quantity) as quantity, SUM(sales_order_products.total_price) as revenue')
            ->where('sales_orders.created_by', $companyId)
            ->whereBetween('sales_orders.created_at', [$dateFrom, $dateTo])
            ->groupBy('products.id', 'products.name')
            ->orderBy('revenue', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'quantity' => (int) $item->quantity,
                    'revenue' => (float) $item->revenue,
                ];
            });

        $summary['total_revenue'] = $productSales->sum('revenue');
        $summary['best_seller'] = $productSales->first()['name'] ?? null;

        return Inertia::render('reports/product-reports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'productSales' => $productSales,
        ]);
    }

    public function customers(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $companyId = Auth::user()->creatorId();

        $summary = [
            'total_contacts' => Contact::where('created_by', $companyId)->count(),
            'new_contacts' => Contact::where('created_by', $companyId)->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'active_contacts' => Contact::where('created_by', $companyId)->where('status', 'active')->count(),
            'contact_lifetime_value' => 0,
        ];

        $monthlyData = Contact::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, COUNT(*) as count')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = Contact::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, COUNT(*) as count')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $topContacts = DB::table('contacts')
            ->join('sales_orders', 'contacts.id', '=', 'sales_orders.billing_contact_id')
            ->selectRaw('contacts.name, SUM(sales_orders.total_amount) as total_spent, COUNT(sales_orders.id) as order_count')
            ->where('contacts.created_by', $companyId)
            ->where('sales_orders.created_by', $companyId)
            ->whereBetween('sales_orders.created_at', [$dateFrom, $dateTo])
            ->groupBy('contacts.id', 'contacts.name')
            ->orderBy('total_spent', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'total_spent' => (float) $item->total_spent,
                    'order_count' => (int) $item->order_count,
                ];
            });

        return Inertia::render('reports/customer-reports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'topContacts' => $topContacts,
        ]);
    }

    public function customerOutstanding(Request $request)
    {
        $date = $request->get('date', Carbon::now()->format('Y-m-d'));
        $companyId = Auth::user()->creatorId();

        $filters = [
            'date' => $date,
            'customer_type' => $request->get('customer_type'),
            'customer_id' => $request->get('customer_id'),
            'per_page' => (int) $request->get('per_page', 10),
        ];

        $customersQuery = Customer::query()
            ->select(['id', 'name', 'code', 'type', 'privileged_customer_number', 'current_balance'])
            ->orderBy('name');

        if ($filters['customer_type'] && $filters['customer_type'] !== 'all') {
            $customersQuery->where('type', $filters['customer_type']);
        }

        if ($filters['customer_id']) {
            $customersQuery->whereKey($filters['customer_id']);
        }

        $customers = $customersQuery->get();
        $customerOptions = Customer::query()
            ->select(['id', 'name', 'code', 'type'])
            ->when($filters['customer_type'] && $filters['customer_type'] !== 'all', function ($query) use ($filters): void {
                $query->where('type', $filters['customer_type']);
            })
            ->orderBy('name')
            ->get()
            ->map(function (Customer $customer): array {
                $code = $customer->code ? $customer->code.' - ' : '';

                return [
                    'value' => (string) $customer->id,
                    'label' => $code.$customer->name,
                ];
            });

        $totals = [
            'total' => 0,
            'buckets' => [
                '0_30' => 0,
                '30_60' => 0,
                '61_90' => 0,
                'gt_90' => 0,
            ],
        ];

        if ($customers->isEmpty()) {
            return Inertia::render('reports/customer-outstanding-report', [
                'filters' => $filters,
                'summary' => $totals,
                'customers' => [],
                'customerOptions' => $customerOptions,
            ]);
        }

        $salesTransactions = SalesTransaction::query()
            ->with('customer')
            ->where('created_by', $companyId)
            ->whereIn('customer_id', $customers->pluck('id')->all())
            ->whereIn('status', [SaleStatus::Completed->value, SaleStatus::Partial->value])
            ->whereDate('sale_date', '<=', $date)
            ->where('balance_amount', '>', 0)
            ->get();

        $customersMap = $customers->keyBy('id');
        $customersById = [];

        foreach ($salesTransactions as $sale) {
            $customer = $sale->customer;

            if (! $customer || ! $customersMap->has($customer->id)) {
                continue;
            }

            $days = Carbon::parse($sale->sale_date)->diffInDays(Carbon::parse($date), false);
            $days = max(0, $days);

            if ($days <= 30) {
                $bucket = '0_30';
            } elseif ($days <= 60) {
                $bucket = '30_60';
            } elseif ($days <= 90) {
                $bucket = '61_90';
            } else {
                $bucket = 'gt_90';
            }

            if (! isset($customersById[$customer->id])) {
                $customersById[$customer->id] = [
                    'id' => $customer->id,
                    'code' => $customer->code,
                    'name' => $customer->name,
                    'type' => $customer->type,
                    'privileged_customer_number' => $customer->privileged_customer_number,
                    'buckets' => [
                        '0_30' => 0,
                        '30_60' => 0,
                        '61_90' => 0,
                        'gt_90' => 0,
                    ],
                    'total' => 0,
                ];
            }

            $remaining = (float) $sale->balance_amount;

            $customersById[$customer->id]['buckets'][$bucket] += $remaining;
            $customersById[$customer->id]['total'] += $remaining;

            $totals['buckets'][$bucket] += $remaining;
            $totals['total'] += $remaining;
        }

        $customers = array_values($customersById);

        usort($customers, function ($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        return Inertia::render('reports/customer-outstanding-report', [
            'filters' => $filters,
            'summary' => $totals,
            'customers' => $customers,
            'customerOptions' => $customerOptions,
        ]);
    }

    public function projects(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $companyId = Auth::user()->creatorId();

        $summary = [
            'total_projects' => Project::where('created_by', $companyId)->count(),
            'active_projects' => Project::where('created_by', $companyId)->where('status', 'active')->count(),
            'completed_projects' => Project::where('created_by', $companyId)->where('status', 'completed')->count(),
            'completion_rate' => 0,
        ];

        if ($summary['total_projects'] > 0) {
            $summary['completion_rate'] = ($summary['completed_projects'] / $summary['total_projects']) * 100;
        }

        $monthlyData = Project::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period, COUNT(*) as count')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $dailyData = Project::selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d") as period, COUNT(*) as count')
            ->where('created_by', $companyId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $projectsByStatus = Project::selectRaw('status, COUNT(*) as total')
            ->where('created_by', $companyId)
            ->groupBy('status')
            ->get();

        return Inertia::render('reports/project-reports', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'monthlyData' => $monthlyData,
            'dailyData' => $dailyData,
            'projectsByStatus' => $projectsByStatus,
        ]);
    }

    public function supplierProductReport(Request $request)
    {
        $companyId = Auth::user()->creatorId();
        $supplierId = $request->get('supplier_id');
        $suppliers = \App\Models\Supplier::select('id', 'company_name')->get();

        $products = [];
        if ($supplierId) {
            $products = Product::query()
                ->where('products.created_by', $companyId)
                ->whereHas('grnItems', function ($query) use ($supplierId) {
                    $query->whereHas('grn', function ($q) use ($supplierId) {
                        $q->where('sup_id', $supplierId);
                    });
                })
                ->with(['detailsPrices', 'unit'])
                ->get()
                ->map(function ($product) {
                    // Sales in last 30 days
                    $salesCount = DB::table('sales_transaction_items')
                        ->join('sales_transactions', 'sales_transaction_items.sales_transaction_id', '=', 'sales_transactions.id')
                        ->where('sales_transaction_items.product_id', $product->id)
                        ->where('sales_transactions.status', SaleStatus::Completed->value)
                        ->where('sales_transactions.sale_date', '>=', Carbon::now()->subDays(30))
                        ->sum('sales_transaction_items.quantity');

                    $movingStatus = 'Normal';
                    if ($salesCount >= 50) {
                        $movingStatus = 'Fast';
                    } elseif ($salesCount < 10) {
                        $movingStatus = 'Slow';
                    }

                    // Earliest Expiry from GRN Items
                    $earliestExpiry = DB::table('grn_items')
                        ->where('product_id', $product->id)
                        ->whereNotNull('expiry_date')
                        ->where('expiry_date', '>', Carbon::now())
                        ->orderBy('expiry_date', 'asc')
                        ->value('expiry_date');

                    $isExpiringSoon = false;
                    if ($earliestExpiry) {
                        $expiryDate = Carbon::parse($earliestExpiry);
                        if ($expiryDate->lessThanOrEqualTo(Carbon::now()->addMonths(3))) {
                            $isExpiringSoon = true;
                        }
                    }

                    $costPrice = (float) $product->cost_price;
                    $salePrice = (float) $product->sale_price;
                    $stock = (float) $product->stock_quantity;
                    $profit = ($salePrice - $costPrice) * $stock;

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'unit' => $product->unit?->name,
                        'stock' => $stock,
                        'cost_price' => $costPrice,
                        'sale_price' => $salePrice,
                        'profit' => round($profit, 2),
                        'sales_30_days' => (float) $salesCount,
                        'moving_status' => $movingStatus,
                        'expiry_date' => $earliestExpiry,
                        'is_expiring_soon' => $isExpiringSoon,
                    ];
                });
        }

        return Inertia::render('reports/supplier-product-report', [
            'suppliers' => $suppliers,
            'products' => $products,
            'filters' => ['supplier_id' => $supplierId],
        ]);
    }

    public function reorderLevelReport(Request $request)
    {
        $companyId = Auth::user()->creatorId();

        $products = Product::query()
            ->where('created_by', $companyId)
            ->with(['category', 'unit', 'brand'])
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'brand' => $product->brand?->name,
                    'unit' => $product->unit?->name,
                    'stock_quantity' => (float) $product->stock_quantity,
                    'reorder_level' => (float) $product->reorder_level,
                    'status' => $product->status,
                ];
            });

        return Inertia::render('reports/reorder-level-report', [
            'products' => $products,
        ]);
    }

    public function fastSlowMovingReport(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $companyId = Auth::user()->creatorId();

        $productSales = DB::table('products')
            ->leftJoin('sales_transaction_items', 'products.id', '=', 'sales_transaction_items.product_id')
            ->leftJoin('sales_transactions', 'sales_transaction_items.sales_transaction_id', '=', 'sales_transactions.id')
            ->selectRaw('products.id, products.name, products.sku, SUM(sales_transaction_items.quantity) as total_quantity, SUM(sales_transaction_items.total_price) as total_revenue')
            ->where('products.created_by', $companyId)
            ->where(function ($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('sales_transactions.sale_date', [$dateFrom, $dateTo])
                    ->orWhereNull('sales_transactions.id');
            })
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->get()
            ->map(function ($item) {
                $quantity = (float) ($item->total_quantity ?? 0);

                // Logic for moving status
                if ($quantity >= 50) {
                    $status = 'Fast';
                } elseif ($quantity > 0 && $quantity < 10) {
                    $status = 'Slow';
                } elseif ($quantity == 0) {
                    $status = 'Non-Moving';
                } else {
                    $status = 'Normal';
                }

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'total_quantity' => $quantity,
                    'total_revenue' => (float) ($item->total_revenue ?? 0),
                    'moving_status' => $status,
                ];
            });

        $summary = [
            'total_items' => $productSales->count(),
            'fast_moving' => $productSales->where('moving_status', 'Fast')->count(),
            'slow_moving' => $productSales->where('moving_status', 'Slow')->count(),
            'non_moving' => $productSales->where('moving_status', 'Non-Moving')->count(),
        ];

        $movingDistribution = [
            ['name' => 'Fast', 'value' => $summary['fast_moving'], 'fill' => '#22c55e'],
            ['name' => 'Normal', 'value' => $productSales->where('moving_status', 'Normal')->count(), 'fill' => '#3b82f6'],
            ['name' => 'Slow', 'value' => $summary['slow_moving'], 'fill' => '#f59e0b'],
            ['name' => 'Non-Moving', 'value' => $summary['non_moving'], 'fill' => '#ef4444'],
        ];

        return Inertia::render('reports/fast-slow-moving-report', [
            'filters' => compact('dateFrom', 'dateTo'),
            'summary' => $summary,
            'productSales' => $productSales->sortByDesc('total_quantity')->values()->all(),
            'movingDistribution' => $movingDistribution,
        ]);
    }
}
