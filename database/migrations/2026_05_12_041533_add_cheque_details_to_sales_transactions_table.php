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
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->string('cheque_no')->nullable()->after('payment_method');
            $table->date('cheque_date')->nullable()->after('cheque_no');
            $table->string('cheque_bank')->nullable()->after('cheque_date');
            $table->string('cheque_branch')->nullable()->after('cheque_bank');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropColumn(['cheque_no', 'cheque_date', 'cheque_bank', 'cheque_branch']);
        });
    }
};
