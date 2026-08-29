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
        Schema::table('stock_transfers', function (Blueprint $table) {
            // Acceptance workflow fields
            $table->foreignId('accepted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('accepted_at')->nullable();

            // Rejection workflow fields
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // Add index for tracking pending acceptances
            $table->index(['to_branch_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropForeignIdFor(Model: \App\Models\User::class, column: 'accepted_by');
            $table->dropForeignIdFor(Model: \App\Models\User::class, column: 'rejected_by');
            $table->dropColumn(['accepted_by', 'accepted_at', 'rejected_by', 'rejected_at', 'rejection_reason']);
            $table->dropIndex(['to_branch_id', 'status']);
        });
    }
};
