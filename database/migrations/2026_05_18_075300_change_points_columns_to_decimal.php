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
            $table->decimal('points', 10, 2)->default(0.00)->change();
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->decimal('points_earned', 10, 2)->default(0.00)->change();
        });

        Schema::table('points_earning_rules', function (Blueprint $table) {
            $table->decimal('points_earned', 10, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->unsignedInteger('points')->default(0)->change();
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->unsignedInteger('points_earned')->default(0)->change();
        });

        Schema::table('points_earning_rules', function (Blueprint $table) {
            $table->unsignedInteger('points_earned')->change();
        });
    }
};
