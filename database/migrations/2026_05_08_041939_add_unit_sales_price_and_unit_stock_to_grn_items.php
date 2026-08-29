<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grn_items', function (Blueprint $table) {
            if (! Schema::hasColumn('grn_items', 'unit_sales_price')) {
                $table->decimal('unit_sales_price', 15, 4)->nullable()->after('unit_cost_price');
            }
            if (! Schema::hasColumn('grn_items', 'unit_stock')) {
                $table->decimal('unit_stock', 15, 4)->nullable()->after('unit_sales_price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grn_items', function (Blueprint $table) {
            $table->dropColumn(['unit_sales_price', 'unit_stock']);
        });
    }
};
