<?php

use Illuminate\Support\Facades\Schema;

it('creates the gin tables with the expected columns', function () {
    expect(Schema::hasTable('gins'))->toBeTrue()
        ->and(Schema::hasColumns('gins', [
            'id',
            'gin_no',
            'batch_no',
            'gin_date',
            'total_amount',
            'description',
            'created_by',
            'status',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
            'deleted_at',
        ]))->toBeTrue()
        ->and(Schema::hasTable('gin_items'))->toBeTrue()
        ->and(Schema::hasColumns('gin_items', [
            'id',
            'gin_id',
            'product_id',
            'quantity',
            'cost_price',
            'total_price',
            'created_at',
            'updated_at',
            'deleted_at',
        ]))->toBeTrue();
});
