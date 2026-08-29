<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('production_in_items');
        Schema::dropIfExists('production_ins');
        Schema::dropIfExists('gin_items');
        Schema::dropIfExists('gins');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Tables were intentionally removed; restoration not supported.
    }
};
