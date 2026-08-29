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
        Schema::create('gins', function (Blueprint $table) {
            $table->id();
            $table->string('gin_no')->unique();
            $table->string('batch_no')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            
            $table->date('gin_date');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('description')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('status')->nullable()->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gins');
    }
};
