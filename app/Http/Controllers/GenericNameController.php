<?php

namespace App\Http\Controllers;

use App\Models\GenericName;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GenericNameController extends Controller
{
    public function index(Request $request)
    {
        $query = GenericName::query()
            ->where('created_by', createdBy());

        if ($request->has('search') && ! empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->has('status') && ! empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('sort_field') && ! empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('id', 'desc');
        }

        $genericNames = $query->paginate($request->per_page ?? 10);

        return Inertia::render('generic-names/index', [
            'genericNames' => $genericNames,
            'filters' => $request->all(['search', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['created_by'] = createdBy();
        $validated['status'] = $validated['status'] ?? 'active';

        GenericName::create($validated);

        return redirect()->back()->with('success', __('Generic name created successfully.'));
    }

    public function update(Request $request, $id)
    {
        $genericName = GenericName::where('id', $id)
            ->where('created_by', createdBy())
            ->first();

        if ($genericName) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'status' => 'nullable|in:active,inactive',
                ]);

                $genericName->update($validated);

                return redirect()->back()->with('success', __('Generic name updated successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update generic name.'));
            }
        } else {
            return redirect()->back()->with('error', __('Generic name not found.'));
        }
    }

    public function destroy($id)
    {
        $genericName = GenericName::where('id', $id)
            ->where('created_by', createdBy())
            ->first();

        if ($genericName) {
            try {
                $genericName->delete();

                return redirect()->back()->with('success', __('Generic name deleted successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete generic name.'));
            }
        } else {
            return redirect()->back()->with('error', __('Generic name not found.'));
        }
    }

    public function toggleStatus($id)
    {
        $genericName = GenericName::where('id', $id)
            ->where('created_by', createdBy())
            ->first();

        if ($genericName) {
            try {
                $genericName->status = $genericName->status === 'active' ? 'inactive' : 'active';
                $genericName->save();

                return redirect()->back()->with('success', __('Generic name status updated successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update generic name status.'));
            }
        } else {
            return redirect()->back()->with('error', __('Generic name not found.'));
        }
    }
}
