<?php

namespace App\Http\Controllers;

use App\Models\CustomerDetailsReport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerDetailsReportController extends Controller
{
    public function index(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $type = $request->get('type', 'all');
        $search = $request->get('search', '');

        $customersQuery = CustomerDetailsReport::query()
            ->whereBetween('created_at', ["{$dateFrom} 00:00:00", "{$dateTo} 23:59:59"]);

        if ($type !== '' && $type !== 'all') {
            $customersQuery->where('type', $type);
        }

        if ($search !== '') {
            $customersQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('privileged_customer_number', 'like', "%{$search}%");
            });
        }

        $customers = $customersQuery
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'email', 'phone', 'type', 'privileged_customer_number']);

        $summary = [
            'total_customers' => $customers->count(),
            'customer_count' => $customers->where('type', 'customer')->count(),
            'privileged_customer_count' => $customers->where('type', 'privileged_customer')->count(),
        ];

        return Inertia::render('reports/customer-details-report', [
            'filters' => compact('dateFrom', 'dateTo', 'type', 'search'),
            'summary' => $summary,
            'customers' => $customers,
        ]);
    }
}
