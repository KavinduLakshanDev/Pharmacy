<?php

use App\Enums\MasterTransactionStatus;
use App\Enums\MasterTransactionType;
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
        Schema::create('master_transactions', function (Blueprint $table) {
            $table->id();

            // The product whose stock is being affected
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            // Direction of the transaction (IN/OUT)
            $table->string('transaction_type', 20)->default(MasterTransactionType::In->value);

            // Polymorphic link to the record that caused this transaction (e.g. GRN, usage note, delivery)
            $table->string('transactionable_type')->nullable();
            $table->unsignedBigInteger('transactionable_id')->nullable();

            // Optional polymorphic stock location (e.g. outlet, delivery vehicle, warehouse)
            $table->string('stock_type')->nullable();
            $table->unsignedBigInteger('stock_type_id')->nullable();

            // Core values for this transaction line
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            // Stock tracking for the product (before and after this transaction)
            $table->integer('previous_stock')->default(0);
            $table->integer('current_stock')->default(0);

            // Auto-generated reference (GRN-000001, USG-000001, etc.)
            $table->string('reference_number')->unique();
            $table->dateTime('transaction_date')->useCurrent();
            $table->text('notes')->nullable();

            // Approval workflow
            $table->string('status', 20)->default(MasterTransactionStatus::Completed->value);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for common query patterns
            $table->index(['product_id', 'transaction_date']);
            $table->index(['transaction_type', 'status']);
            $table->index(['transactionable_type', 'transactionable_id'], 'mt_transactionable_index');
            $table->index(['stock_type', 'stock_type_id'], 'mt_stock_location_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_transactions');
    }
};
