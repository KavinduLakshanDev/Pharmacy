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
        Schema::table('customers', function (Blueprint $table) {
            $table->unsignedInteger('points')->default(0)->after('current_balance');
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->unsignedInteger('points_earned')->default(0)->after('balance_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('points');
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropColumn('points_earned');
        });
    }
};
