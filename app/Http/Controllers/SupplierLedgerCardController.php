<?php

namespace App\Http\Controllers;

use App\Models\Grn;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierReturn;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class SupplierLedgerCardController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $supplierId = $request->integer('supplier_id') ?: null;

        $openingBalance = $this->openingBalance($dateFrom, $supplierId);
        $ledgerEntries = $this->ledgerEntries($dateFrom, $dateTo, $supplierId, $openingBalance);

        $totalDebits = $ledgerEntries->sum('debit');
        $totalCredits = $ledgerEntries->sum('credit');

        return Inertia::render('reports/supplier-ledger-card', [
            'filters' => [
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'supplierId' => $supplierId,
            ],
            'suppliers' => Supplier::query()
                ->select('id', 'company_name', 'contact_person_name')
                ->orderBy('company_name')
                ->get(),
            'summary' => [
                'opening_balance' => round($openingBalance, 2),
                'total_debits' => round($totalDebits, 2),
                'total_credits' => round($totalCredits, 2),
                'closing_balance' => round($openingBalance + $totalDebits - $totalCredits, 2),
            ],
            'ledgerEntries' => $ledgerEntries->values(),
        ]);
    }

    private function openingBalance(string $dateFrom, ?int $supplierId): float
    {
        $grnTotals = Grn::query()
            ->where('created_by', createdBy())
            ->whereDate('grn_date', '<', $dateFrom)
            ->when($supplierId, fn ($query) => $query->where('sup_id', $supplierId))
            ->selectRaw('COALESCE(SUM(total_amount), 0) as debits, COALESCE(SUM(paid_amount), 0) as credits')
            ->first();

        $paymentCredits = SupplierPayment::query()
            ->where('created_by', createdBy())
            ->whereDate('payment_date', '<', $dateFrom)
            ->when($supplierId, fn ($query) => $query->where('supplier_id', $supplierId))
            ->sum('paid_amount');

        $returnCredits = SupplierReturn::query()
            ->where('created_by', createdBy())
            ->whereDate('return_date', '<', $dateFrom)
            ->when($supplierId, fn ($query) => $query->where('supplier_id', $supplierId))
            ->sum('total_amount');

        return (float) ($grnTotals?->debits ?? 0)
            + (float) $paymentCredits
            - (float) ($grnTotals?->credits ?? 0)
            - (float) $returnCredits;
    }

    private function ledgerEntries(string $dateFrom, string $dateTo, ?int $supplierId, float $openingBalance): Collection
    {
        $grnEntries = Grn::query()
            ->with('supplier:id,company_name')
            ->where('created_by', createdBy())
            ->whereBetween('grn_date', [$dateFrom, $dateTo])
            ->when($supplierId, fn ($query) => $query->where('sup_id', $supplierId))
            ->get()
            ->map(fn (Grn $grn): array => [
                'date' => $grn->grn_date?->format('Y-m-d'),
                'supplier_id' => $grn->sup_id,
                'supplier_name' => $grn->supplier?->company_name ?? '-',
                'reference' => $grn->grn_no,
                'description' => $grn->invoice_no ? "GRN Invoice {$grn->invoice_no}" : 'GRN Purchase',
                'debit' => (float) $grn->total_amount,
                'credit' => (float) $grn->paid_amount,
                'sort_order' => 1,
            ]);

        $paymentEntries = SupplierPayment::query()
            ->with('supplier:id,company_name')
            ->where('created_by', createdBy())
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->when($supplierId, fn ($query) => $query->where('supplier_id', $supplierId))
            ->get()
            ->map(fn (SupplierPayment $payment): array => [
                'date' => $payment->payment_date?->format('Y-m-d'),
                'supplier_id' => $payment->supplier_id,
                'supplier_name' => $payment->supplier?->company_name ?? '-',
                'reference' => sprintf('SP-%s', $payment->id),
                'description' => trim("Supplier Payment - {$payment->payment_method}".($payment->notes ? " ({$payment->notes})" : '')),
                'debit' => (float) $payment->paid_amount,
                'credit' => 0.0,
                'sort_order' => 2,
            ]);

        $returnEntries = SupplierReturn::query()
            ->with('supplier:id,company_name')
            ->where('created_by', createdBy())
            ->whereBetween('return_date', [$dateFrom, $dateTo])
            ->when($supplierId, fn ($query) => $query->where('supplier_id', $supplierId))
            ->get()
            ->map(fn (SupplierReturn $supplierReturn): array => [
                'date' => $supplierReturn->return_date?->format('Y-m-d'),
                'supplier_id' => $supplierReturn->supplier_id,
                'supplier_name' => $supplierReturn->supplier?->company_name ?? '-',
                'reference' => $supplierReturn->return_number,
                'description' => trim('Supplier Return'.($supplierReturn->notes ? " ({$supplierReturn->notes})" : '')),
                'debit' => 0.0,
                'credit' => (float) $supplierReturn->total_amount,
                'sort_order' => 3,
            ]);

        $runningBalance = $openingBalance;

        return $grnEntries
            ->concat($paymentEntries)
            ->concat($returnEntries)
            ->sortBy([
                ['date', 'asc'],
                ['sort_order', 'asc'],
                ['reference', 'asc'],
            ])
            ->map(function (array $entry) use (&$runningBalance): array {
                $runningBalance += $entry['debit'] - $entry['credit'];
                $entry['balance'] = round($runningBalance, 2);
                unset($entry['sort_order']);

                return $entry;
            });
    }
}
