<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierDetailsReportController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $search = $request->get('search', '');

        $suppliersQuery = Supplier::query()
            ->whereBetween('created_at', ["{$dateFrom} 00:00:00", "{$dateTo} 23:59:59"]);

        if ($search !== '') {
            $suppliersQuery->where(function ($query) use ($search): void {
                $query->where('company_name', 'like', "%{$search}%")
                    ->orWhere('mail', 'like', "%{$search}%")
                    ->orWhere('tel_no', 'like', "%{$search}%")
                    ->orWhere('contact_person_name', 'like', "%{$search}%");
            });
        }

        $suppliers = $suppliersQuery
            ->orderBy('company_name')
            ->get(['id', 'company_name', 'mail', 'tel_no', 'contact_person_name']);

        return Inertia::render('reports/supplier-details-report', [
            'filters' => compact('dateFrom', 'dateTo', 'search'),
            'summary' => [
                'total_suppliers' => $suppliers->count(),
            ],
            'suppliers' => $suppliers,
        ]);
    }
}
