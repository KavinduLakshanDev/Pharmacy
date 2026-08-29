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
        Schema::table('customer_returns', function (Blueprint $table) {
            $table->decimal('invoice_return_credit', 12, 2)->default(0);
            $table->decimal('exchange_purchase_amount', 12, 2)->default(0);
            $table->decimal('customer_additional_payment_due', 12, 2)->default(0);
            $table->decimal('customer_credit_after_exchange', 12, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_returns', function (Blueprint $table) {
            $table->dropColumn([
                'invoice_return_credit',
                'exchange_purchase_amount',
                'customer_additional_payment_due',
                'customer_credit_after_exchange',
            ]);
        });
    }
};
