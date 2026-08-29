<?php

namespace App\Http\Controllers;

use App\Models\DrugForm;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DrugFormController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $query = DrugForm::query()
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

        $drugForms = $query->paginate($request->per_page ?? 10);

        return Inertia::render('drug-forms/index', [
            'drugForms' => $drugForms,
            'filters' => $request->all(['search', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['created_by'] = createdBy();
        $validated['status'] = $validated['status'] ?? 'active';

        DrugForm::create($validated);

        return redirect()->back()->with('success', __('Drug form created successfully.'));
    }

    public function update(Request $request, $id): \Illuminate\Http\RedirectResponse
    {
        $drugForm = DrugForm::where('id', $id)
            ->where('created_by', createdBy())
            ->first();

        if ($drugForm) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'status' => 'nullable|in:active,inactive',
                ]);

                $drugForm->update($validated);

                return redirect()->back()->with('success', __('Drug form updated successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update drug form.'));
            }
        } else {
            return redirect()->back()->with('error', __('Drug form not found.'));
        }
    }

    public function destroy($id): \Illuminate\Http\RedirectResponse
    {
        $drugForm = DrugForm::where('id', $id)
            ->where('created_by', createdBy())
            ->first();

        if ($drugForm) {
            try {
                $drugForm->delete();

                return redirect()->back()->with('success', __('Drug form deleted successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete drug form.'));
            }
        } else {
            return redirect()->back()->with('error', __('Drug form not found.'));
        }
    }

    public function toggleStatus($id): \Illuminate\Http\RedirectResponse
    {
        $drugForm = DrugForm::where('id', $id)
            ->where('created_by', createdBy())
            ->first();

        if ($drugForm) {
            try {
                $drugForm->status = $drugForm->status === 'active' ? 'inactive' : 'active';
                $drugForm->save();

                return redirect()->back()->with('success', __('Drug form status updated successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update drug form status.'));
            }
        } else {
            return redirect()->back()->with('error', __('Drug form not found.'));
        }
    }
}
