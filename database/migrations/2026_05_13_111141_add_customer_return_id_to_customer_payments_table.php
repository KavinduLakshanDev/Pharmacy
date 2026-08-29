<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('customer_payments', 'customer_return_id')) {
            return;
        }

        Schema::table('customer_payments', function (Blueprint $table): void {
            $table->foreignId('customer_return_id')
                ->nullable()
                ->constrained('customer_returns')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('customer_payments', 'customer_return_id')) {
            return;
        }

        Schema::table('customer_payments', function (Blueprint $table): void {
            $table->dropForeign(['customer_return_id']);
        });
    }
};
