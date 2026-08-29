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
        Schema::table('grns', function (Blueprint $table) {
            if (! Schema::hasColumn('grns', 'invoice_no')) {
                $table->string('invoice_no')->nullable()->after('batch_no');
            }
        });

        Schema::table('grn_items', function (Blueprint $table) {
            if (! Schema::hasColumn('grn_items', 'expiry_date')) {
                $table->date('expiry_date')->nullable()->after('quantity');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grn_items', function (Blueprint $table) {
            $table->dropColumn('expiry_date');
        });

        Schema::table('grns', function (Blueprint $table) {
            $table->dropColumn('invoice_no');
        });
    }
};
