<?php

namespace App\Http\Controllers\Inventory;

use App\Enums\StockTransferStatus;
use App\Enums\WastageStatus;
use App\Http\Controllers\Controller;
use App\Models\Grn;
use App\Models\MasterTransaction;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\User;
use App\Models\Wastage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $companyId = $user->creatorId();

        $activeProductsQuery = Product::query()
            ->where('created_by', $companyId)
            ->where('status', 'active');

        $activeProducts = (clone $activeProductsQuery)->count();
        $lowStockProducts = (clone $activeProductsQuery)
            ->whereRaw('stock_quantity <= COALESCE(reorder_level, 0)')
            ->count();

        $pendingTransfers = StockTransfer::query()
            ->where('created_by', $companyId)
            ->whereIn('status', [StockTransferStatus::Pending, StockTransferStatus::Approved])
            ->count();

        $pendingWastages = Wastage::query()
            ->where('created_by', $companyId)
            ->where('status', WastageStatus::Pending)
            ->count();

        $grnCount = Grn::query()
            ->whereHas('items.product', fn ($query) => $query->where('created_by', $companyId))
            ->count();

        $movementsLast30Days = MasterTransaction::query()
            ->whereHas('product', fn ($query) => $query->where('created_by', $companyId))
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        return Inertia::render('inventory/dashboard', [
            'stats' => [
                'active_products' => $activeProducts,
                'low_stock_products' => $lowStockProducts,
                'pending_transfers' => $pendingTransfers,
                'pending_wastages' => $pendingWastages,
                'grn_count' => $grnCount,
                'movements_last_30_days' => $movementsLast30Days,
            ],
        ]);
    }
}
