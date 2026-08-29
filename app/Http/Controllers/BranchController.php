<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::where('created_by', createdBy());

        // Handle search
        if ($request->has('search') && ! empty($request->search)) {
            $query->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('email', 'like', '%'.$request->search.'%')
                ->orWhere('phone', 'like', '%'.$request->search.'%');
        }

        // Handle sorting
        if ($request->has('sort_field') && ! empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $branches = $query->paginate($request->per_page ?? 10);

        return Inertia::render('branches/index', [
            'branches' => $branches,
            'filters' => $request->all(['search', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'address' => 'nullable|string',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'status' => 'nullable|in:active,inactive',
            ]);

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            // Check if branch with same name already exists
            $exists = Branch::where('name', $validated['name'])
                ->where('created_by', createdBy())
                ->exists();

            if ($exists) {
                return redirect()->back()->with('error', __('Branch with this name already exists.'));
            }

            Branch::create($validated);

            return redirect()->back()->with('success', __('Branch created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create branch'));
        }
    }

    public function update(Request $request, $branchId)
    {
        $branch = Branch::where('id', $branchId)
            ->where('created_by', createdBy())
            ->first();

        if ($branch) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'address' => 'nullable|string',
                    'phone' => 'nullable|string|max:20',
                    'email' => 'nullable|email|max:255',
                    'status' => 'nullable|in:active,inactive',
                ]);

                // Check if branch with same name already exists (excluding current branch)
                $exists = Branch::where('name', $validated['name'])
                    ->where('created_by', createdBy())
                    ->where('id', '!=', $branchId)
                    ->exists();

                if ($exists) {
                    return redirect()->back()->with('error', __('Branch with this name already exists.'));
                }

                $branch->update($validated);

                return redirect()->back()->with('success', __('Branch updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update branch'));
            }
        } else {
            return redirect()->back()->with('error', __('Branch Not Found.'));
        }
    }

    public function destroy($branchId)
    {
        $branch = Branch::where('id', $branchId)
            ->where('created_by', createdBy())
            ->first();

        if ($branch) {
            try {
                $branch->delete();

                return redirect()->back()->with('success', __('Branch deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete branch'));
            }
        } else {
            return redirect()->back()->with('error', __('Branch Not Found.'));
        }
    }

    public function toggleStatus($branchId)
    {
        $branch = Branch::where('id', $branchId)
            ->where('created_by', createdBy())
            ->first();

        if ($branch) {
            try {
                $branch->status = $branch->status === 'active' ? 'inactive' : 'active';
                $branch->save();

                return redirect()->back()->with('success', __('Branch status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update branch status'));
            }
        } else {
            return redirect()->back()->with('error', __('Branch Not Found.'));
        }
    }
}
