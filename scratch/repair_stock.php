<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Enums\SaleStatus;
use App\Models\GrnItem;
use App\Models\SalesTransactionItem;

echo "--- Stock Repair --- \n";

// 1. Reset all GrnItem unit_stock based on initial quantity
foreach (GrnItem::all() as $g) {
    $initialUnits = (float) $g->quantity * (float) ($g->pack_size ?: 1);
    $g->unit_stock = $initialUnits;
    $g->save();
}
echo "Reset GrnItem unit_stock to initial values.\n";

// 2. Subtract quantities from all Completed/Partial sales
$salesItems = SalesTransactionItem::whereHas('salesTransaction', function ($q) {
    $q->whereIn('status', [SaleStatus::Completed->value, SaleStatus::Partial->value]);
})->get();

foreach ($salesItems as $item) {
    $grnItem = GrnItem::where('grn_items.product_id', $item->product_id)
        ->where('grn_items.batch_no', $item->batch_no)
        ->join('grns', 'grns.id', '=', 'grn_items.grn_id')
        ->where('grns.branch_id', $item->salesTransaction->branch_id)
        ->select('grn_items.*')
        ->first();

    if ($grnItem) {
        $grnItem->decrement('unit_stock', $item->quantity);
        echo "Decremented stock for {$item->salesTransaction->sale_no}: {$item->product_id} | {$item->batch_no} by {$item->quantity}\n";
    }
}

echo "Stock repair completed!\n";
