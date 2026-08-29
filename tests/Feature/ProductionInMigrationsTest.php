<?php

use Illuminate\Support\Facades\Schema;

test('production in schema is created with required columns', function () {
    expect(Schema::hasTable('production_ins'))->toBeTrue()
        ->and(Schema::hasColumns('production_ins', [
            'id',
            'production_in_no',
            'gin_id',
            'production_in_date',
            'total_amount',
            'description',
            'created_by',
            'status',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
            'deleted_at',
        ]))->toBeTrue();
});

test('production in items schema is created with required columns', function () {
    expect(Schema::hasTable('production_in_items'))->toBeTrue()
        ->and(Schema::hasColumns('production_in_items', [
            'id',
            'production_in_id',
            'product_id',
            'quantity',
            'cost_price',
            'total_price',
            'created_at',
            'updated_at',
            'deleted_at',
        ]))->toBeTrue();
});
