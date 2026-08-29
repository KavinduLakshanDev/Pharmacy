<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix any duplicate/missing customer codes then add a unique constraint.
     */
    public function up(): void
    {
        // Assign codes to rows that have NULL or empty codes
        $nullRows = DB::table('customers')
            ->whereNull('code')
            ->orWhere('code', '')
            ->orderBy('id')
            ->get(['id']);

        foreach ($nullRows as $row) {
            $maxNumber = DB::table('customers')
                ->whereNotNull('code')
                ->where('code', 'like', 'CUST%')
                ->get(['code'])
                ->max(fn ($c) => intval(substr($c->code, 4)));

            $newCode = 'CUST'.str_pad(($maxNumber ?? 0) + 1, 3, '0', STR_PAD_LEFT);
            DB::table('customers')->where('id', $row->id)->update(['code' => $newCode]);
        }

        // Resolve any remaining duplicates: keep the lowest ID's code, re-assign the rest
        $duplicates = DB::table('customers')
            ->select('code', DB::raw('COUNT(*) as cnt'))
            ->whereNotNull('code')
            ->groupBy('code')
            ->having('cnt', '>', 1)
            ->get();

        foreach ($duplicates as $dup) {
            $rows = DB::table('customers')
                ->where('code', $dup->code)
                ->orderBy('id')
                ->get(['id']);

            // Keep first row's code, re-assign subsequent rows
            foreach ($rows->skip(1) as $row) {
                $maxNumber = DB::table('customers')
                    ->whereNotNull('code')
                    ->where('code', 'like', 'CUST%')
                    ->get(['code'])
                    ->max(fn ($c) => intval(substr($c->code, 4)));

                $newCode = 'CUST'.str_pad(($maxNumber ?? 0) + 1, 3, '0', STR_PAD_LEFT);
                DB::table('customers')->where('id', $row->id)->update(['code' => $newCode]);
            }
        }

        // Add unique constraint
        Schema::table('customers', function (Blueprint $table) {
            $table->unique('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique(['code']);
        });
    }
};
