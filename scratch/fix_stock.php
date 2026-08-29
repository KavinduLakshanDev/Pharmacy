<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SalesTransaction;

echo "--- Recalculating Sales to fix Stock ---\n";
$sales = SalesTransaction::whereIn('status', ['completed', 'partial'])->get();
foreach ($sales as $sale) {
    echo "Processing Sale: {$sale->sale_no}...\n";
    $sale->calculateTotals();
}
echo "Done!\n";
