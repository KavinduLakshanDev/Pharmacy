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
        Schema::create('gin_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gin_id')->constrained('gins')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            $table->decimal('quantity', 15, 2)->nullable()->default(0);
            $table->decimal('cost_price', 15, 2)->nullable()->default(0);
            $table->decimal('total_price', 15, 2)->nullable()->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gin_items');
    }
};
