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
        Schema::create('sale_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_transaction_id')->constrained('sales_transactions')->onDelete('cascade');
            $table->string('payment_method'); // cash, card, cheque, bank_transfer
            $table->decimal('amount', 15, 2);
            $table->foreignId('finance_account_id')->nullable()->constrained('finance_accounts')->onDelete('set null');
            
            // Cheque specific fields
            $table->string('cheque_no')->nullable();
            $table->date('cheque_date')->nullable();
            $table->string('cheque_bank')->nullable();
            $table->string('cheque_branch')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
    }
};
