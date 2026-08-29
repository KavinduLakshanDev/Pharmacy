<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashRegister;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashRegisterController extends Controller
{
    public function index(Request $request)
    {
        $query = CashRegister::with(['creator', 'branch'])->where('created_by', createdBy());

        // Handle search
        if ($request->has('search') && ! empty($request->search)) {
            $query->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('register_code', 'like', '%'.$request->search.'%')
                ->orWhere('description', 'like', '%'.$request->search.'%');
        }

        // Handle status filter
        if ($request->has('status') && ! empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Handle sorting
        if ($request->has('sort_field') && ! empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $cashRegisters = $query->paginate($request->per_page ?? 10);

        return Inertia::render('cash-registers/index', [
            'cashRegisters' => $cashRegisters,
            'branches' => Branch::where('created_by', createdBy())->get(),
            'filters' => $request->all(['search', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'branch_id' => 'required|exists:branches,id',
                'name' => 'required|string|max:255',
                'register_code' => 'required|string|max:255|unique:cash_registers,register_code',
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive,maintenance',
                'settings' => 'nullable|array',
            ]);

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            // Check if cash register with same code already exists
            $exists = CashRegister::where('register_code', $validated['register_code'])
                ->where('created_by', createdBy())
                ->exists();

            if ($exists) {
                return redirect()->back()->with('error', __('Cash register with this code already exists.'));
            }

            CashRegister::create($validated);

            return redirect()->back()->with('success', __('Cash register created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create cash register'));
        }
    }

    public function update(Request $request, $cashRegisterId)
    {
        $cashRegister = CashRegister::where('id', $cashRegisterId)
            ->where('created_by', createdBy())
            ->first();

        if ($cashRegister) {
            try {
                $validated = $request->validate([
                    'branch_id' => 'required|exists:branches,id',
                    'name' => 'required|string|max:255',
                    'register_code' => 'required|string|max:255|unique:cash_registers,register_code,'.$cashRegisterId,
                    'description' => 'nullable|string',
                    'status' => 'nullable|in:active,inactive,maintenance',
                    'settings' => 'nullable|array',
                ]);

                // Check if cash register with same code already exists (excluding current)
                $exists = CashRegister::where('register_code', $validated['register_code'])
                    ->where('created_by', createdBy())
                    ->where('id', '!=', $cashRegisterId)
                    ->exists();

                if ($exists) {
                    return redirect()->back()->with('error', __('Cash register with this code already exists.'));
                }

                $cashRegister->update($validated);

                return redirect()->back()->with('success', __('Cash register updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update cash register'));
            }
        } else {
            return redirect()->back()->with('error', __('Cash register not found.'));
        }
    }

    public function destroy($cashRegisterId)
    {
        $cashRegister = CashRegister::where('id', $cashRegisterId)
            ->where('created_by', createdBy())
            ->first();

        if ($cashRegister) {
            try {
                $cashRegister->delete();

                return redirect()->back()->with('success', __('Cash register deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete cash register'));
            }
        } else {
            return redirect()->back()->with('error', __('Cash register not found.'));
        }
    }

    public function toggleStatus($cashRegisterId)
    {
        $cashRegister = CashRegister::where('id', $cashRegisterId)
            ->where('created_by', createdBy())
            ->first();

        if ($cashRegister) {
            try {
                $statuses = ['active', 'inactive', 'maintenance'];
                $currentIndex = array_search($cashRegister->status, $statuses);
                $nextIndex = ($currentIndex + 1) % count($statuses);
                $cashRegister->status = $statuses[$nextIndex];
                $cashRegister->save();

                return redirect()->back()->with('success', __('Cash register status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update cash register status'));
            }
        } else {
            return redirect()->back()->with('error', __('Cash register not found.'));
        }
    }
}
