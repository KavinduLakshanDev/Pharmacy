<?php

namespace App\Http\Controllers\CustomerPortal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\Prescription;
use App\Models\SalesTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPortalController extends Controller
{
    /**
     * Show the customer portal dashboard.
     */
    public function dashboard(): Response
    {
        $user = auth()->user();
        $customer = Customer::where('user_id', $user->id)->first();

        $recentSales = [];
        $recentPayments = [];

        if ($customer) {
            $recentSales = SalesTransaction::where('customer_id', $customer->id)
                ->with('items.product:id,name,sku')
                ->latest('sale_date')
                ->limit(5)
                ->get(['id', 'sale_no', 'sale_date', 'total_amount', 'paid_amount', 'balance_amount', 'status', 'customer_id']);

            $recentPayments = CustomerPayment::where('customer_id', $customer->id)
                ->latest('payment_date')
                ->limit(5)
                ->get(['id', 'payment_date', 'paid_amount', 'payment_method', 'notes']);
        }

        return Inertia::render('customer-portal/dashboard', [
            'customer' => $customer,
            'recentSales' => $recentSales,
            'recentPayments' => $recentPayments,
            'recentPrescriptions' => $customer
                ? Prescription::where('customer_id', $customer->id)
                    ->latest()
                    ->limit(5)
                    ->get(['id', 'status', 'staff_message', 'created_at'])
                : [],
        ]);
    }

    /**
     * Show the customer profile page.
     */
    public function profile(): Response
    {
        $user = auth()->user();
        $customer = Customer::where('user_id', $user->id)->first();

        return Inertia::render('customer-portal/profile', [
            'customer' => $customer ? array_merge(
                $customer->only(['id', 'name', 'code', 'email', 'phone', 'address', 'avatar']),
                ['avatar_url' => $customer->avatar ? asset('storage/'.$customer->avatar) : null]
            ) : null,
            'user' => $user->only(['name', 'email']),
        ]);
    }

    /**
     * Update the customer avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $customer = Customer::where('user_id', $user->id)->first();

        if (! $customer) {
            return back()->withErrors(['error' => __('Customer profile not found.')]);
        }

        if ($customer->avatar) {
            Storage::disk('public')->delete($customer->avatar);
        }

        $path = $request->file('avatar')->store('customer-avatars', 'public');
        $customer->update(['avatar' => $path]);

        return back()->with('success', __('Profile photo updated successfully.'));
    }

    /**
     * Update the customer profile.
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:1000',
        ]);

        $customer = Customer::where('user_id', $user->id)->first();

        if ($customer) {
            $customer->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ]);
        } else {
            Customer::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'type' => 'customer',
            ]);
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return back()->with('success', __('Profile updated successfully.'));
    }
}
