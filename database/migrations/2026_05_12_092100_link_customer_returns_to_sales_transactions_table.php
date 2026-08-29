<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_return_items', function (Blueprint $table): void {
            $table->foreignId('sales_transaction_item_id')
                ->nullable()
                ->constrained('sales_transaction_items')
                ->nullOnDelete();
        });

        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->dropForeign(['grn_id']);
        });

        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->foreignId('sales_transaction_id')
                ->nullable()
                ->constrained('sales_transactions')
                ->nullOnDelete();
        });

        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->unsignedBigInteger('grn_id')->nullable()->change();
        });

        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->foreign('grn_id')->references('id')->on('grns')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->dropForeign(['sales_transaction_id']);
            $table->dropForeign(['grn_id']);
        });

        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->dropColumn('sales_transaction_id');
        });

        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->unsignedBigInteger('grn_id')->nullable(false)->change();
        });

        Schema::table('customer_returns', function (Blueprint $table): void {
            $table->foreign('grn_id')->references('id')->on('grns')->cascadeOnDelete();
        });

        Schema::table('customer_return_items', function (Blueprint $table): void {
            $table->dropForeign(['sales_transaction_item_id']);
            $table->dropColumn('sales_transaction_item_id');
        });
    }
};
