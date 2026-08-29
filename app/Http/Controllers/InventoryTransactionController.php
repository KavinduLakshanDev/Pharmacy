<?php

namespace App\Http\Controllers;

use App\Models\MasterTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryTransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $latestGrnItemIds = DB::table('grn_items')
            ->select('product_id', 'batch_no', DB::raw('MAX(id) as id'))
            ->whereNotNull('batch_no')
            ->groupBy('product_id', 'batch_no');

        $query = MasterTransaction::query()
            ->with(['product:id,name,sku', 'creator:id,name'])
            ->where('master_transactions.created_by', createdBy())
            ->leftJoinSub($latestGrnItemIds, 'latest_grn_item_keys', function ($join): void {
                $join->on('latest_grn_item_keys.product_id', '=', 'master_transactions.product_id')
                    ->on('latest_grn_item_keys.batch_no', '=', 'master_transactions.batch_no');
            })
            ->leftJoin('grn_items', 'grn_items.id', '=', 'latest_grn_item_keys.id')
            ->select('master_transactions.*', 'grn_items.pack_size')
            ->orderByDesc('master_transactions.id');

        if (filled($request->search)) {
            $search = trim((string) $request->search);

            $query->where(function ($builder) use ($search): void {
                $builder->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($productBuilder) use ($search): void {
                        $productBuilder->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        if (filled($request->transaction_type) && $request->transaction_type !== 'all') {
            $query->where('transaction_type', $request->string('transaction_type')->toString());
        }

        if (filled($request->status) && $request->status !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        if (filled($request->source_type) && $request->source_type !== 'all') {
            $query->where('transactionable_type', $request->string('source_type')->toString());
        }

        if (filled($request->stock_type) && $request->stock_type !== 'all') {
            $query->where('stock_type', $request->string('stock_type')->toString());
        }

        if (filled($request->sort_field)) {
            $query->orderBy(
                $request->string('sort_field')->toString(),
                $request->string('sort_direction')->toString() ?: 'desc',
            );
        }

        $transactions = $query
            ->paginate((int) $request->integer('per_page', 10))
            ->withQueryString();

        return Inertia::render('inventory/transactions/index', [
            'transactions' => $transactions,
            'filters' => $request->only([
                'search',
                'transaction_type',
                'status',
                'source_type',
                'stock_type',
                'sort_field',
                'sort_direction',
                'per_page',
            ]),
        ]);
    }
}
