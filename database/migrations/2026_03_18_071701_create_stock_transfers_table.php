<?php

use App\Enums\StockTransferStatus;
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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();

            // Auto-generated reference number (ST-000001, etc.)
            $table->string('transfer_no')->unique();

            // Source and destination branches
            $table->foreignId('from_branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('to_branch_id')->constrained('branches')->cascadeOnDelete();

            $table->date('transfer_date');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();

            // Approval workflow
            $table->string('status', 20)->default(StockTransferStatus::Pending->value);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['from_branch_id', 'to_branch_id']);
            $table->index(['status', 'transfer_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
