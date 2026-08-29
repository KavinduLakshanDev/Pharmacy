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
        Schema::table('master_transactions', function (Blueprint $table) {
            $table->decimal('quantity', 15, 4)->default(0)->change();
            $table->decimal('previous_stock', 15, 4)->default(0)->change();
            $table->decimal('current_stock', 15, 4)->default(0)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('stock_quantity', 15, 4)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_transactions', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->default(0)->change();
            $table->integer('previous_stock')->default(0)->change();
            $table->integer('current_stock')->default(0)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock_quantity')->default(0)->change();
        });
    }
};
