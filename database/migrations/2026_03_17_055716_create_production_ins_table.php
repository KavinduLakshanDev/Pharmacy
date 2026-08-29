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
        Schema::create('production_ins', function (Blueprint $table) {
            $table->id();
            $table->string('production_in_no')->unique();
            $table->foreignId('gin_id')->nullable()->constrained('gins')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();

            $table->date('production_in_date')->nullable();
            $table->decimal('total_amount', 15, 2)->nullable()->default(0);
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
        Schema::dropIfExists('production_ins');
    }
};
