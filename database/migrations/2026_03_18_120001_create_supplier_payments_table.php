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
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->string('payment_method');
            $table->decimal('paid_amount', 15, 2);
            $table->date('payment_date');
            $table->text('notes')->nullable();

            // Bank / cheque fields
            $table->foreignId('bank_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->string('cheque_no')->nullable();
            $table->string('cheque_bank_name')->nullable();
            $table->string('cheque_branch')->nullable();
            $table->date('cheque_date')->nullable();
            $table->string('cheque_account_no')->nullable();

            $table->string('bank_name')->nullable();
            $table->string('bank_reference_no')->nullable();
            $table->string('bank_branch')->nullable();
            $table->date('bank_deposit_date')->nullable();
            $table->string('bank_account_no')->nullable();

            // Transfer fields
            $table->string('transfer_reference_no')->nullable();
            $table->string('transfer_transaction_id')->nullable();
            $table->string('transfer_bank_name')->nullable();
            $table->string('transfer_branch')->nullable();
            $table->date('transfer_date')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_payments');
    }
};
