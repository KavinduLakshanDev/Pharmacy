<?php

namespace App\Http\Controllers;

use App\Http\Requests\UnitRequest;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->wantsJson()) {
            $query = Unit::query();

            if ($request->filled('search')) {
                $query->where('name', 'like', '%'.$request->search.'%');
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            return response()->json($query->paginate($request->get('per_page', 15)));
        }

        $query = Unit::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('sort_field') && ! empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $units = $query->paginate($request->per_page ?? 10);

        return Inertia::render('units/index', [
            'units' => $units,
            'filters' => $request->all(['search', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UnitRequest $request)
    {
        if ($request->wantsJson()) {
            $unit = Unit::create($request->validated());

            return response()->json($unit, 201);
        }

        Unit::create($request->validated());

        return redirect()->back()->with('success', __('Unit created successfully.'));
    }

    /**
     * Display the specified resource.
     */
    public function show(Unit $unit)
    {
        if (request()->wantsJson()) {
            return response()->json($unit);
        }

        return redirect()->route('units.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UnitRequest $request, Unit $unit)
    {
        if ($request->wantsJson()) {
            $unit->update($request->validated());

            return response()->json($unit);
        }

        $unit->update($request->validated());

        return redirect()->back()->with('success', __('Unit updated successfully.'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Unit $unit)
    {
        if (request()->wantsJson()) {
            $unit->delete();

            return response()->noContent();
        }

        $unit->delete();

        return redirect()->back()->with('success', __('Unit deleted successfully.'));
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(Unit $unit)
    {
        $unit->status = $unit->status === 'active' ? 'inactive' : 'active';
        $unit->save();

        return redirect()->back()->with('success', __('Unit status updated successfully.'));
    }
}
