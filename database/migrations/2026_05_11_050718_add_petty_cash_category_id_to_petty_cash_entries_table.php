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
        Schema::table('petty_cash_entries', function (Blueprint $table) {
            $table->foreignId('petty_cash_category_id')->nullable()->constrained('petty_cash_categories')->nullOnDelete()->after('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('petty_cash_entries', function (Blueprint $table) {
            $table->dropForeign(['petty_cash_category_id']);
            $table->dropColumn('petty_cash_category_id');
        });
    }
};
