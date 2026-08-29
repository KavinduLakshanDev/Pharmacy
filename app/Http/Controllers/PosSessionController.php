<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\PosSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosSessionController extends Controller
{
    public function index(Request $request)
    {
        $query = PosSession::with(['user', 'branch', 'cashRegister'])
            ->withSum('sales as total_sales_amount', 'paid_amount')
            ->withCount('sales as total_sales_count');

        // Filter by user's own sessions or all if has permission
        if (! auth()->user()->can('manage-any-pos-sessions')) {
            $query->where('user_id', auth()->id());
        }

        // Handle search
        if ($request->has('search') && ! empty($request->search)) {
            $query->where('session_number', 'like', '%'.$request->search.'%')
                ->orWhereHas('user', function ($q) use ($request) {
                    $q->where('name', 'like', '%'.$request->search.'%');
                })
                ->orWhereHas('cashRegister', function ($q) use ($request) {
                    $q->where('name', 'like', '%'.$request->search.'%');
                });
        }

        // Handle status filter
        if ($request->has('status') && ! empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Handle sorting
        if ($request->has('sort_field') && ! empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('opened_at', 'desc');
        }

        $posSessions = $query->paginate($request->per_page ?? 10);

        return Inertia::render('pos-sessions/index', [
            'posSessions' => $posSessions,
            'cashRegisters' => CashRegister::where('created_by', createdBy())->get(),
            'branches' => Branch::where('created_by', createdBy())->get(),
            'filters' => $request->all(['search', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'cash_register_id' => 'required|exists:cash_registers,id',
                'opening_balance' => 'required|numeric|min:0',
                'notes' => 'nullable|string',
            ]);

            // Check if cash register is available (not in active session)
            $activeSession = PosSession::where('cash_register_id', $validated['cash_register_id'])
                ->where('status', 'active')
                ->exists();

            if ($activeSession) {
                return redirect()->back()->with('error', __('Cash register is already in use.'));
            }

            $cashRegister = CashRegister::find($validated['cash_register_id']);

            $validated['user_id'] = auth()->id();
            $validated['branch_id'] = $cashRegister->branch_id;
            $validated['session_number'] = $this->generateSessionNumber($cashRegister, auth()->user());
            $validated['status'] = 'active';
            $validated['opened_at'] = now();

            PosSession::create($validated);

            return redirect()->back()->with('success', __('POS session started successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to start POS session'));
        }
    }

    public function update(Request $request, $posSessionId)
    {
        $posSession = PosSession::find($posSessionId);

        if (! $posSession) {
            return redirect()->back()->with('error', __('POS session not found.'));
        }

        // Check permissions
        if (! auth()->user()->can('manage-any-pos-sessions') && $posSession->user_id !== auth()->id()) {
            return redirect()->back()->with('error', __('Unauthorized.'));
        }

        try {
            $validated = $request->validate([
                'closing_balance' => 'nullable|numeric|min:0',
                'expected_balance' => 'nullable|numeric|min:0',
                'difference' => 'nullable|numeric',
                'total_sales' => 'nullable|integer|min:0',
                'total_sales_amount' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
                'status' => 'nullable|in:active,closed',
            ]);

            if ($validated['status'] === 'closed') {
                $validated['closed_at'] = now();
            }

            $posSession->update($validated);

            return redirect()->back()->with('success', __('POS session updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update POS session'));
        }
    }

    public function destroy($posSessionId)
    {
        $posSession = PosSession::find($posSessionId);

        if (! $posSession) {
            return redirect()->back()->with('error', __('POS session not found.'));
        }

        // Check permissions
        if (! auth()->user()->can('manage-any-pos-sessions') && $posSession->user_id !== auth()->id()) {
            return redirect()->back()->with('error', __('Unauthorized.'));
        }

        try {
            $posSession->delete();

            return redirect()->back()->with('success', __('POS session deleted successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete POS session'));
        }
    }

    public function close(Request $request, $posSessionId)
    {
        $posSession = PosSession::find($posSessionId);

        if (! $posSession) {
            return redirect()->back()->with('error', __('POS session not found.'));
        }

        // Check permissions
        if (! auth()->user()->can('manage-any-pos-sessions') && $posSession->user_id !== auth()->id()) {
            return redirect()->back()->with('error', __('Unauthorized.'));
        }

        if ($posSession->status !== 'active') {
            return redirect()->back()->with('error', __('Session is not active.'));
        }

        try {
            $validated = $request->validate([
                'closing_balance' => 'required|numeric|min:0',
                'notes' => 'nullable|string',
            ]);

            $totalSalesCount = $posSession->sales()->count();
            $totalSalesAmount = $posSession->sales()->sum('paid_amount');
            $expectedBalance = $posSession->opening_balance + $totalSalesAmount;
            $difference = $validated['closing_balance'] - $expectedBalance;

            $posSession->update([
                'status' => 'closed',
                'closed_at' => now(),
                'closing_balance' => $validated['closing_balance'],
                'expected_balance' => $expectedBalance,
                'difference' => $difference,
                'total_sales' => $totalSalesCount,
                'total_sales_amount' => $totalSalesAmount,
                'notes' => $validated['notes'] ?? $posSession->notes,
            ]);

            return redirect()->back()->with('success', __('POS session closed successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to close POS session'));
        }
    }

    private function generateSessionNumber($cashRegister, $user)
    {
        $branchCode = strtoupper(substr($cashRegister->branch->name, 0, 2));
        $registerCode = strtoupper(substr($cashRegister->register_code, 0, 2));
        $userCode = strtoupper(substr($user->name, 0, 2));
        $date = now()->format('ymd');
        $sequence = PosSession::whereDate('created_at', today())->count() + 1;

        return sprintf('%s%s%s%s%03d', $branchCode, $registerCode, $userCode, $date, $sequence);
    }
}
