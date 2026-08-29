<?php
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\DB;
$wastages = DB::table('wastages')->whereIn('wastage_no', ['WST-000004','WST-000005','WST-000006'])->get();
echo 'Wastages: '.count($wastages)."\n";
foreach ($wastages as $w) {
    echo $w->id.' '.$w->wastage_no.' branch '.$w->branch_id.' total '.$w->total_amount."\n";
}
$ids = $wastages->pluck('id')->all();
$items = DB::table('wastage_items')->whereIn('wastage_id', $ids)->get();
foreach ($items as $item) {
    echo 'item '.$item->id.' wastage '.$item->wastage_id.' prod '.$item->product_id.' qty '.$item->quantity.' unit '.$item->unit_price.' total '.$item->total_price."\n";
}
$tx = DB::table('master_transactions')->whereIn('transactionable_id', $ids)->where('transactionable_type', 'Wastage')->get();
foreach ($tx as $t) {
    echo 'tx '.$t->id.' qty '.$t->quantity.' unit '.$t->unit_price.' total '.$t->total_amount."\n";
}
