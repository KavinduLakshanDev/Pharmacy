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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->text('address')->nullable();
            $table->string('tel_no')->nullable();
            $table->string('mail')->nullable();
            $table->string('website')->nullable();
            $table->string('vat_registered')->default('not_registered')->nullable();
            $table->string('vat_no')->nullable();
            $table->string('contact_person_name')->nullable();
            $table->string('contact_no')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
