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
        if (! Schema::hasTable('pos_sessions')) {
            Schema::create('pos_sessions', function (Blueprint $table) {
                $table->id();
                $table->string('session_number')->unique(); // Branch + Cash Register + User + Year + Month + Date + a Sequence Number using ID
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
                $table->foreignId('cash_register_id')->nullable()->constrained('cash_registers')->onDelete('set null');
                $table->decimal('opening_balance', 10, 2);
                $table->decimal('closing_balance', 10, 2)->nullable();
                $table->decimal('expected_balance', 10, 2)->nullable();
                $table->decimal('difference', 10, 2)->nullable();
                $table->integer('total_sales')->default(0);
                $table->decimal('total_sales_amount', 10, 2)->default(0);
                $table->enum('status', ['active', 'closed'])->default('active');
                $table->timestamp('opened_at');
                $table->timestamp('closed_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'status']);
                $table->index(['cash_register_id', 'status']);
                $table->index(['opened_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_sessions');
    }
};
