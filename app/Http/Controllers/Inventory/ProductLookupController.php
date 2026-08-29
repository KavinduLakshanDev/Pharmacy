<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductLookupController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::query()
            ->with(['brand', 'category', 'genericName', 'drugForm', 'unit'])
            ->where('created_by', createdBy())
            ->where('status', 'active');

        if ($request->has('search') && $request->search !== null && trim($request->search) !== '') {
            $query->where(function ($subQuery) use ($request) {
                $subQuery->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('sku', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        $sortField = $request->get('sort_field', 'name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $perPage = $request->get('per_page', 10);

        $products = $query->orderBy($sortField, $sortDirection)->paginate($perPage);

        return Inertia::render('inventory/product-lookup/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function show(int $product): Response
    {
        $product = Product::query()
            ->with(['brand', 'category', 'genericName', 'drugForm', 'unit'])
            ->where('created_by', createdBy())
            ->where('status', 'active')
            ->findOrFail($product);

        return Inertia::render('inventory/product-lookup/Show', [
            'product' => $product,
        ]);
    }
}
