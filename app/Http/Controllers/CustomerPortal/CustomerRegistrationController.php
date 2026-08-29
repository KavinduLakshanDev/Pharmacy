<?php

namespace App\Http\Controllers\CustomerPortal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class CustomerRegistrationController extends Controller
{
    /**
     * Show the customer registration form.
     */
    public function create(): Response
    {
        return Inertia::render('customer-portal/register');
    }

    /**
     * Handle an incoming customer registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:1000',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'type' => 'customer',
            'is_active' => 1,
            'is_enable_login' => 1,
            'created_by' => 1,
        ]);

        // Assign the customer role
        $user->assignRole('customer');

        // Find existing customer record by email or create a new one
        $customer = Customer::where('email', $request->email)->first();

        if ($customer) {
            $customer->update(['user_id' => $user->id]);
        } else {
            // Auto-generate customer code using the highest existing numeric suffix
            $prefix = 'CUST';
            $maxNumber = Customer::whereNotNull('code')
                ->where('code', 'like', $prefix.'%')
                ->get(['code'])
                ->max(fn ($c) => intval(substr($c->code, strlen($prefix))));
            $code = $prefix.str_pad(($maxNumber ?? 0) + 1, 3, '0', STR_PAD_LEFT);

            Customer::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'type' => 'customer',
                'code' => $code,
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route('customer-portal.dashboard');
    }
}
