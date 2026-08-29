<?php

namespace App\Http\Controllers;

use App\Models\DeliveryRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryRouteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = DeliveryRoute::query();

        // Handle search
        if ($request->has('search') && ! empty($request->search)) {
            $query->where('routename', 'like', '%'.$request->search.'%')
                ->orWhere('routecode', 'like', '%'.$request->search.'%')
                ->orWhere('description', 'like', '%'.$request->search.'%');
        }

        // Handle sorting
        if ($request->has('sort_field') && ! empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $deliveryRoutes = $query
            ->paginate((int) $request->integer('per_page', 10))
            ->withQueryString();

        return Inertia::render('DeliveryRoutes/Index', [
            'deliveryRoutes' => $deliveryRoutes,
            'filters' => $request->all(['search', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('DeliveryRoutes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'routename' => 'required|string|max:255',
            'routecode' => 'required|string|max:255|unique:delivery_routes',
            'description' => 'nullable|string',
            'created_by' => 'nullable|integer',
        ]);

        $validated['created_by'] = $validated['created_by'] ?? auth()->id();

        $deliveryRoute = DeliveryRoute::create($validated);

        return redirect()->route('delivery-routes.show', $deliveryRoute)->with('success', 'Delivery route updated successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(DeliveryRoute $deliveryRoute)
    {
        return Inertia::render('DeliveryRoutes/Show', [
            'deliveryRoute' => $deliveryRoute->load('creator'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(DeliveryRoute $deliveryRoute)
    {
        return Inertia::render('DeliveryRoutes/Edit', [
            'deliveryRoute' => $deliveryRoute,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DeliveryRoute $deliveryRoute)
    {
        $validated = $request->validate([
            'routename' => 'required|string|max:255',
            'routecode' => 'required|string|max:255|unique:delivery_routes,routecode,'.$deliveryRoute->id,
            'description' => 'nullable|string',
            'created_by' => 'nullable|integer',
        ]);

        $deliveryRoute->update($validated);

        return redirect()->route('delivery-routes.index')->with('success', 'Delivery route updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DeliveryRoute $deliveryRoute)
    {
        $deliveryRoute->delete();

        return redirect()->route('delivery-routes.index')->with('success', __('Delivery route deleted successfully.'));
    }
}
