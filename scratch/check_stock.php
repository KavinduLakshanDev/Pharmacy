<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\GrnItem;
use App\Models\SalesTransactionItem;

$productId = 9;

echo "--- Sales for Product ID $productId ---\n";
foreach (SalesTransactionItem::where('product_id', $productId)->get() as $i) {
    echo "Sale: {$i->salesTransaction->sale_no} | Status: {$i->salesTransaction->status->value} | Qty: {$i->quantity} | Batch: {$i->batch_no}\n";
}

echo "\n--- GRN Stock for Product ID $productId ---\n";
foreach (GrnItem::where('product_id', $productId)->get() as $g) {
    echo "Batch: {$g->batch_no} | Stock: {$g->unit_stock}\n";
}
