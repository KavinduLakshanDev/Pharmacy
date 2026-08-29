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
        Schema::table('wastage_items', function (Blueprint $table) {
            if (! Schema::hasColumn('wastage_items', 'batch_no')) {
                $table->string('batch_no')->nullable()->after('product_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wastage_items', function (Blueprint $table) {
            if (Schema::hasColumn('wastage_items', 'batch_no')) {
                $table->dropColumn('batch_no');
            }
        });
    }
};
