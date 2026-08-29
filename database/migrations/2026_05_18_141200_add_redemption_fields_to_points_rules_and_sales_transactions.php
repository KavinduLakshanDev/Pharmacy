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
        Schema::table('points_earning_rules', function (Blueprint $table) {
            $table->decimal('redemption_points', 10, 2)->default(1.00)->after('points_earned');
            $table->decimal('redemption_amount', 15, 2)->default(1.00)->after('redemption_points');
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->decimal('points_redeemed', 10, 2)->default(0.00)->after('points_earned');
            $table->decimal('points_redeemed_amount', 15, 2)->default(0.00)->after('points_redeemed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('points_earning_rules', function (Blueprint $table) {
            $table->dropColumn(['redemption_points', 'redemption_amount']);
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropColumn(['points_redeemed', 'points_redeemed_amount']);
        });
    }
};
