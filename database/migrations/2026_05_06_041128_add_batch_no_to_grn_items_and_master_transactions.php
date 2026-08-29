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
            $table->string('batch_no')->nullable()->after('expiry_date');
        });

        Schema::table('master_transactions', function (Blueprint $table) {
            $table->string('batch_no')->nullable()->after('notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grn_items', function (Blueprint $table) {
            $table->dropColumn('batch_no');
        });

        Schema::table('master_transactions', function (Blueprint $table) {
            $table->dropColumn('batch_no');
        });
    }
};
