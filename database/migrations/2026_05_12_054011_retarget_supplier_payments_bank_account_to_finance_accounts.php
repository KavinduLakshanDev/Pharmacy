<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->retargetPaymentBankAccount('supplier_payments');
        $this->retargetPaymentBankAccount('customer_payments');
    }

    public function down(): void
    {
        $this->restoreBankAccountsForeignKey('supplier_payments');
        $this->restoreBankAccountsForeignKey('customer_payments');
    }

    private function retargetPaymentBankAccount(string $table): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint): void {
            $tableBlueprint->dropForeign(['bank_account_id']);
        });

        DB::table($table)->update(['bank_account_id' => null]);

        Schema::table($table, function (Blueprint $tableBlueprint): void {
            $tableBlueprint->foreign('bank_account_id')
                ->references('id')
                ->on('finance_accounts')
                ->nullOnDelete();
        });
    }

    private function restoreBankAccountsForeignKey(string $table): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint): void {
            $tableBlueprint->dropForeign(['bank_account_id']);
        });

        DB::table($table)->update(['bank_account_id' => null]);

        Schema::table($table, function (Blueprint $tableBlueprint): void {
            $tableBlueprint->foreign('bank_account_id')
                ->references('id')
                ->on('bank_accounts')
                ->nullOnDelete();
        });
    }
};
