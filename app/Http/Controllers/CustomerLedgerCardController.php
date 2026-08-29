<?php

namespace App\Http\Controllers;

use App\Enums\SaleStatus;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\SalesTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CustomerLedgerCardController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $customerId = $request->integer('customer_id') ?: null;

        $openingBalance = $this->openingBalance($dateFrom, $customerId);
        $ledgerEntries = $this->ledgerEntries($dateFrom, $dateTo, $customerId, $openingBalance);

        $totalDebits = $ledgerEntries->sum('debit');
        $totalCredits = $ledgerEntries->sum('credit');

        return Inertia::render('reports/customer-ledger-card', [
            'filters' => [
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'customerId' => $customerId,
            ],
            'customers' => Customer::query()
                ->select('id', 'name', 'code', 'email')
                ->orderBy('name')
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

    private function openingBalance(string $dateFrom, ?int $customerId): float
    {
        $saleTotals = SalesTransaction::query()
            ->where('created_by', createdBy())
            ->where('status', SaleStatus::Completed)
            ->whereDate('sale_date', '<', $dateFrom)
            ->when($customerId, fn ($query) => $query->where('customer_id', $customerId))
            ->selectRaw('COALESCE(SUM(total_amount), 0) as debits, COALESCE(SUM(paid_amount), 0) as credits')
            ->first();

        $paymentCredits = CustomerPayment::query()
            ->where('created_by', createdBy())
            ->whereDate('payment_date', '<', $dateFrom)
            ->when($customerId, fn ($query) => $query->where('customer_id', $customerId))
            ->sum('paid_amount');

        return (float) ($saleTotals?->debits ?? 0)
            + (float) $paymentCredits
            - (float) ($saleTotals?->credits ?? 0);
    }

    private function ledgerEntries(string $dateFrom, string $dateTo, ?int $customerId, float $openingBalance): Collection
    {
        $saleEntries = SalesTransaction::query()
            ->with('customer:id,name,code')
            ->where('created_by', createdBy())
            ->where('status', SaleStatus::Completed)
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->when($customerId, fn ($query) => $query->where('customer_id', $customerId))
            ->get()
            ->map(fn (SalesTransaction $sale): array => [
                'date' => $sale->sale_date?->format('Y-m-d'),
                'customer_id' => $sale->customer_id,
                'customer_name' => $sale->customer?->name ?? '-',
                'reference' => $sale->sale_no,
                'description' => trim((string) ($sale->description ?? '')) !== '' ? (string) $sale->description : 'POS / Sale',
                'debit' => (float) $sale->total_amount,
                'credit' => (float) $sale->paid_amount,
                'sort_order' => 1,
            ]);

        $paymentEntries = CustomerPayment::query()
            ->with('customer:id,name,code')
            ->where('created_by', createdBy())
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->when($customerId, fn ($query) => $query->where('customer_id', $customerId))
            ->get()
            ->map(fn (CustomerPayment $payment): array => [
                'date' => $payment->payment_date?->format('Y-m-d'),
                'customer_id' => $payment->customer_id,
                'customer_name' => $payment->customer?->name ?? '-',
                'reference' => sprintf('CP-%s', $payment->id),
                'description' => trim('Customer Payment - '.$payment->payment_method.($payment->notes ? " ({$payment->notes})" : '')),
                'debit' => (float) $payment->paid_amount,
                'credit' => 0.0,
                'sort_order' => 2,
            ]);

        $runningBalance = $openingBalance;

        return $saleEntries
            ->concat($paymentEntries)
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
