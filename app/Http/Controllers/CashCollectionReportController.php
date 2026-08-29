<?php

namespace App\Http\Controllers;

use App\Enums\SaleStatus;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\PosSession;
use App\Models\SalesTransaction;
use App\Models\SupplierPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class CashCollectionReportController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        $branchId = $request->filled('branch_id') ? (int) $request->get('branch_id') : null;
        $customerId = $request->filled('customer_id') ? (int) $request->get('customer_id') : null;
        $paymentMethod = $request->get('payment_method', 'all');
        $search = trim((string) $request->get('search', ''));
        $perPage = max(10, min(100, (int) $request->get('per_page', 25)));
        $page = max(1, (int) $request->get('page', 1));

        $companyId = createdBy();
        $creatorIds = $this->companyCreatorIds($companyId);

        $branches = Branch::query()
            ->where('created_by', $companyId)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Branch $branch): array => [
                'value' => (string) $branch->id,
                'label' => $branch->name,
            ]);

        $customerOptions = Customer::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(function (Customer $customer): array {
                $code = $customer->code ? $customer->code.' — ' : '';

                return [
                    'value' => (string) $customer->id,
                    'label' => $code.$customer->name,
                ];
            });

        $paymentMethodOptions = [
            ['value' => 'all', 'label' => __('All methods')],
            ['value' => 'cash', 'label' => __('Cash')],
            ['value' => 'card', 'label' => __('Card')],
            ['value' => 'bank_transfer', 'label' => __('Bank transfer')],
            ['value' => 'credit', 'label' => __('Credit')],
            ['value' => 'cheque', 'label' => __('Cheque')],
        ];

        $rows = $this->collectRows(
            $companyId,
            $creatorIds,
            $dateFrom,
            $dateTo,
            $branchId,
            $customerId,
            $paymentMethod,
        );

        if ($search !== '') {
            $needle = mb_strtolower($search);
            $rows = $rows->filter(function (array $row) use ($needle): bool {
                return str_contains(mb_strtolower($row['reference']), $needle)
                    || str_contains(mb_strtolower((string) $row['customer']), $needle)
                    || str_contains(mb_strtolower((string) $row['type']), $needle);
            })->values();
        }

        $running = 0.0;
        $rows = $rows->map(function (array $row) use (&$running): array {
            $running += (float) $row['cash_in'] - (float) $row['cash_out'];
            $row['balance'] = round($running, 2);
            $row['balance_direction'] = $running >= 0 ? 'IN' : 'OUT';

            return $row;
        });

        $summary = $this->buildSummary($rows);

        $total = $rows->count();
        $slice = $rows->slice(($page - 1) * $perPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $slice,
            $total,
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );
        $paginator->withQueryString();

        $filters = [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'branch_id' => $branchId ? (string) $branchId : '',
            'customer_id' => $customerId ? (string) $customerId : '',
            'payment_method' => $paymentMethod,
            'search' => $search,
            'per_page' => $perPage,
        ];

        return Inertia::render('reports/cash-collection-report', [
            'filters' => $filters,
            'branches' => $branches,
            'customerOptions' => $customerOptions,
            'paymentMethodOptions' => $paymentMethodOptions,
            'summary' => $summary,
            'rows' => $paginator,
        ]);
    }

    /**
     * @return array<int, int>
     */
    private function companyCreatorIds(int $companyId): array
    {
        return User::query()
            ->where(function ($query) use ($companyId): void {
                $query->where('id', $companyId)
                    ->orWhere('created_by', $companyId);
            })
            ->pluck('id')
            ->all();
    }

    /**
     * @param  array<int, int>  $creatorIds
     * @return Collection<int, array<string, mixed>>
     */
    private function collectRows(
        int $companyId,
        array $creatorIds,
        string $dateFrom,
        string $dateTo,
        ?int $branchId,
        ?int $customerId,
        string $paymentMethod,
    ): Collection {
        $entries = collect();

        $customerPaymentsHaveReturnLink = Schema::hasTable('customer_payments')
            && Schema::hasColumn('customer_payments', 'customer_return_id');

        if ($paymentMethod === 'all' || $paymentMethod === 'cash') {
            $sessionQuery = PosSession::query()
                ->with(['branch'])
                ->whereHas('branch', function ($query) use ($companyId): void {
                    $query->where('created_by', $companyId);
                })
                ->whereBetween('opened_at', ["{$dateFrom} 00:00:00", "{$dateTo} 23:59:59"])
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

            foreach ($sessionQuery->cursor() as $session) {
                $opening = (float) $session->opening_balance;
                if ($opening <= 0) {
                    continue;
                }
                $entries->push([
                    'sort_at' => $session->opened_at?->timestamp ?? strtotime($session->opened_at ?? $dateFrom),
                    'date' => $session->opened_at?->format('Y-m-d') ?? $dateFrom,
                    'reference' => (string) $session->session_number,
                    'customer' => '—',
                    'type' => __('Opening Balance'),
                    'type_key' => 'opening_balance',
                    'method' => $this->formatPaymentMethodLabel('cash'),
                    'amount' => round($opening, 2),
                    'cash_in' => round($opening, 2),
                    'cash_out' => 0.0,
                ]);
            }
        }

        $salesQuery = SalesTransaction::query()
            ->with(['customer'])
            ->whereIn('created_by', $creatorIds)
            ->whereNull('deleted_at')
            ->where('status', SaleStatus::Completed)
            ->where('paid_amount', '>', 0)
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($customerId, fn ($q) => $q->where('customer_id', $customerId))
            ->when($paymentMethod !== 'all', fn ($q) => $q->where('payment_method', $paymentMethod));

        foreach ($salesQuery->cursor() as $sale) {
            $paid = (float) $sale->paid_amount;
            $entries->push([
                'sort_at' => Carbon::parse($sale->sale_date->format('Y-m-d').' '.$sale->created_at->format('H:i:s'))->timestamp,
                'date' => $sale->sale_date->format('Y-m-d'),
                'reference' => (string) $sale->sale_no,
                'customer' => $sale->customer?->name ?? __('Walk-in Customer'),
                'type' => __('POS Sale'),
                'type_key' => 'pos_sale',
                'method' => $this->formatPaymentMethodLabel((string) ($sale->payment_method ?? 'cash')),
                'amount' => round($paid, 2),
                'cash_in' => round($paid, 2),
                'cash_out' => 0.0,
            ]);
        }

        $customerPaymentRelations = ['customer'];
        if ($customerPaymentsHaveReturnLink) {
            $customerPaymentRelations[] = 'customerReturn';
        }

        $customerPaymentsQuery = CustomerPayment::query()
            ->with(['customer', 'customerReturn'])
            ->whereIn('created_by', $creatorIds)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->when($customerId, fn ($q) => $q->where('customer_id', $customerId))
            ->when($branchId, function ($q) use ($branchId): void {
                $q->where(function ($w) use ($branchId): void {
                    $w->whereNull('customer_return_id')
                        ->orWhereHas('customerReturn', function ($r) use ($branchId): void {
                            $r->where(function ($r2) use ($branchId): void {
                                $r2->where('branch_id', $branchId)->orWhereNull('branch_id');
                            });
                        });
                });
            });

        foreach ($customerPaymentsQuery->cursor() as $payment) {
            if (! $this->customerPaymentMatchesFilter($paymentMethod, (string) $payment->payment_method)) {
                continue;
            }

            $paid = (float) $payment->paid_amount;
            $isReturnSettlement = $payment->customer_return_id !== null;
            $returnNo = $payment->customerReturn?->return_number;

            $entries->push([
                'sort_at' => Carbon::parse($payment->payment_date->format('Y-m-d').' '.$payment->created_at->format('H:i:s'))->timestamp,
                'date' => $payment->payment_date->format('Y-m-d'),
                'reference' => $isReturnSettlement && $returnNo
                    ? $returnNo.' · PAY-'.$payment->id
                    : 'PAY-'.$payment->id,
                'customer' => $payment->customer?->name ?? '—',
                'type' => $isReturnSettlement ? __('Customer return settlement') : __('Credit Payment'),
                'type_key' => $isReturnSettlement ? 'customer_return' : 'credit_payment',
                'method' => $this->formatPaymentMethodLabel((string) $payment->payment_method),
                'amount' => round($paid, 2),
                'cash_in' => round($paid, 2),
                'cash_out' => 0.0,
            ]);
        }

        $supplierPaymentsQuery = SupplierPayment::query()
            ->with(['supplier'])
            ->whereIn('created_by', $creatorIds)
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->where('payment_method', 'cash')
            ->when($paymentMethod !== 'all' && $paymentMethod !== 'cash', fn ($q) => $q->whereRaw('0 = 1'));

        foreach ($supplierPaymentsQuery->cursor() as $payment) {
            if ($paymentMethod !== 'all' && $paymentMethod !== 'cash') {
                continue;
            }
            $paid = (float) $payment->paid_amount;
            $entries->push([
                'sort_at' => Carbon::parse($payment->payment_date->format('Y-m-d').' '.$payment->created_at->format('H:i:s'))->timestamp,
                'date' => $payment->payment_date->format('Y-m-d'),
                'reference' => 'SPAY-'.$payment->id,
                'customer' => $payment->supplier?->company_name ?? '—',
                'type' => __('Supplier Payment'),
                'type_key' => 'supplier_payment',
                'method' => $this->formatPaymentMethodLabel((string) $payment->payment_method),
                'amount' => round($paid, 2),
                'cash_in' => 0.0,
                'cash_out' => round($paid, 2),
            ]);
        }

        return $entries
            ->sort(function (array $a, array $b): int {
                $time = $a['sort_at'] <=> $b['sort_at'];

                return $time !== 0 ? $time : strcmp((string) $a['reference'], (string) $b['reference']);
            })
            ->values()
            ->map(function (array $row): array {
                unset($row['sort_at']);

                return $row;
            });
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    private function buildSummary(Collection $rows): array
    {
        $opening = (float) $rows->where('type_key', 'opening_balance')->sum('cash_in');
        $salesCollected = (float) $rows->where('type_key', 'pos_sale')->sum('cash_in');
        $creditPayments = (float) $rows->where('type_key', 'credit_payment')->sum('cash_in');
        $customerReturnSettlements = (float) $rows->where('type_key', 'customer_return')->sum('cash_in');
        $cashIn = (float) $rows->sum('cash_in');
        $cashOut = (float) $rows->sum('cash_out');
        $supplierPayments = (float) $rows->where('type_key', 'supplier_payment')->sum('cash_out');
        $net = round($cashIn - $cashOut, 2);

        return [
            'total_entries' => $rows->count(),
            'opening_balance' => round($opening, 2),
            'total_cash_in' => round($cashIn, 2),
            'total_cash_out' => round($cashOut, 2),
            'sales_collected' => round($salesCollected, 2),
            'credit_payments' => round($creditPayments, 2),
            'customer_return_settlements' => round($customerReturnSettlements, 2),
            'supplier_payments' => round($supplierPayments, 2),
            'net_cash' => $net,
            'net_direction' => $net >= 0 ? 'IN' : 'OUT',
        ];
    }

    /**
     * Map persisted customer_payment.method and sale payment_method values to a canonical key for filtering.
     */
    private function normalizeCustomerPaymentMethodKey(string $stored): string
    {
        $normalized = mb_strtolower(trim(str_replace(' ', '_', $stored)));

        return match ($normalized) {
            'cash' => 'cash',
            'cheque' => 'cheque',
            'bank' => 'bank_transfer',
            'online_transfer' => 'online_transfer',
            'credit' => 'credit',
            'card' => 'card',
            'bank_transfer' => 'bank_transfer',
            default => $normalized,
        };
    }

    private function customerPaymentMatchesFilter(string $filter, string $storedMethod): bool
    {
        if ($filter === 'all') {
            return true;
        }

        $key = $this->normalizeCustomerPaymentMethodKey($storedMethod);

        return match ($filter) {
            'cash' => $key === 'cash',
            'cheque' => $key === 'cheque',
            'bank_transfer' => $key === 'bank_transfer',
            'card' => $key === 'card' || $key === 'online_transfer',
            'credit' => $key === 'credit',
            default => false,
        };
    }

    private function formatPaymentMethodLabel(string $method): string
    {
        $key = $this->normalizeCustomerPaymentMethodKey($method);

        return match ($key) {
            'cash' => __('Cash'),
            'card' => __('Card'),
            'cheque' => __('Cheque'),
            'credit' => __('Credit'),
            'bank_transfer' => __('Bank transfer'),
            'online_transfer' => __('Online transfer'),
            default => ucfirst(str_replace('_', ' ', $method)),
        };
    }
}
