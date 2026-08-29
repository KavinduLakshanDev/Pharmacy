<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        $query = Customer::query();

        // Handle search
        if ($request->has('search') && ! empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('code', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%')
                    ->orWhere('phone', 'like', '%'.$request->search.'%');
            });
        }

        // Handle type filter
        if ($request->has('type') && ! empty($request->type) && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Handle sorting
        if ($request->has('sort_field') && ! empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('id', 'desc');
        }

        $customers = $query->paginate($request->per_page ?? 10);

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => $request->all(['search', 'type', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    /**
     * Show the customer registration form.
     */
    public function create(): Response
    {
        return Inertia::render('customers/create');
    }

    /**
     * Store a new customer from registration.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:customers',
            'phone' => ['required', 'regex:/^(\+\d{11}|\d{10})$/'],
            'address' => 'nullable|string',
            'type' => 'nullable|in:customer,privileged_customer',
            'privileged_customer_number' => 'nullable|required_if:type,privileged_customer|string|max:255',
            'current_balance' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $customerData = $request->only([
            'name',
            'email',
            'phone',
            'address',
            'type',
            'privileged_customer_number',
            'current_balance',
        ]);

        $customerData['current_balance'] = $customerData['current_balance'] ?? 0;

        if (($customerData['type'] ?? 'customer') !== 'privileged_customer') {
            $customerData['privileged_customer_number'] = null;
        }

        // Auto-generate code using the highest existing numeric suffix
        $prefix = 'CUST';
        $maxNumber = Customer::whereNotNull('code')
            ->where('code', 'like', $prefix.'%')
            ->get(['code'])
            ->max(fn ($c) => intval(substr($c->code, strlen($prefix))));
        $code = $prefix.str_pad(($maxNumber ?? 0) + 1, 3, '0', STR_PAD_LEFT);

        Customer::create(array_merge($customerData, ['code' => $code]));

        return redirect()->route('customers.index')->with('success', 'Customer created successfully!');
    }

    /**
     * Quickly create a customer from the POS and return JSON.
     */
    public function quickStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:customers',
            'phone' => ['required', 'regex:/^(\+\d{11}|\d{10})$/'],
            'address' => 'nullable|string',
            'type' => 'nullable|in:customer,privileged_customer',
            'privileged_customer_number' => 'nullable|required_if:type,privileged_customer|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = $request->type ?? 'customer';
        $privilegedCustomerNumber = ($type === 'privileged_customer') ? $request->privileged_customer_number : null;

        $prefix = 'CUST';
        $maxNumber = Customer::whereNotNull('code')
            ->where('code', 'like', $prefix.'%')
            ->get(['code'])
            ->max(fn ($c) => intval(substr($c->code, strlen($prefix))));
        $code = $prefix.str_pad(($maxNumber ?? 0) + 1, 3, '0', STR_PAD_LEFT);

        $customer = Customer::create([
            'code' => $code,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'type' => $type,
            'privileged_customer_number' => $privilegedCustomerNumber,
            'current_balance' => 0,
        ]);

        return response()->json(['customer' => $customer->only(['id', 'name', 'code', 'email', 'phone', 'type', 'points', 'privileged_customer_number'])]);
    }

    /**
     * Display the specified customer.
     */
    public function show($id)
    {
        $customer = Customer::findOrFail($id);

        return Inertia::render('customers/show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Show the form for editing the specified customer.
     */
    public function edit($id)
    {
        $customer = Customer::findOrFail($id);

        return Inertia::render('customers/edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:customers,email,'.$id,
            'phone' => ['required', 'regex:/^(\+\d{11}|\d{10})$/'],
            'address' => 'nullable|string',
            'type' => 'nullable|in:customer,privileged_customer',
            'privileged_customer_number' => 'nullable|required_if:type,privileged_customer|string|max:255',
            'current_balance' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $customerData = $request->only([
            'name',
            'email',
            'phone',
            'address',
            'type',
            'privileged_customer_number',
            'current_balance',
        ]);

        $customerData['current_balance'] = $customerData['current_balance'] ?? 0;

        if (($customerData['type'] ?? 'customer') !== 'privileged_customer') {
            $customerData['privileged_customer_number'] = null;
        }

        $customer->update($customerData);

        return redirect()->route('customers.index')->with('success', 'Customer updated successfully!');
    }

    /**
     * Remove the specified customer.
     */
    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Customer deleted successfully!');
    }
}
