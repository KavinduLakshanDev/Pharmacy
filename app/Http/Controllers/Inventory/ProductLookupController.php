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

        $products = $query->orderBy('name')->limit(50)->get();

        return Inertia::render('inventory/product-lookup', [
            'products' => $products,
            'filters' => $request->only('search'),
        ]);
    }

    public function show(int $product): Response
    {
        $product = Product::query()
            ->with(['brand', 'category', 'genericName', 'drugForm', 'unit'])
            ->where('created_by', createdBy())
            ->where('status', 'active')
            ->findOrFail($product);

        return Inertia::render('inventory/product-lookup-show', [
            'product' => $product,
        ]);
    }
}
