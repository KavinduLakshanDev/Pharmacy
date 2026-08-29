<?php

namespace App\Http\Controllers\CustomerPortal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Prescription;
use App\Models\PrescriptionMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionController extends Controller
{
    /**
     * Show the prescription submission form and history.
     */
    public function index(): Response
    {
        $user = auth()->user();
        $customer = Customer::where('user_id', $user->id)->first();

        $prescriptions = [];
        if ($customer) {
            $prescriptions = Prescription::with('messages')
                ->where('customer_id', $customer->id)
                ->latest()
                ->get(['id', 'image_path', 'customer_notes', 'delivery_requested', 'delivery_address', 'status', 'staff_message', 'medicine_items', 'created_at'])
                ->map(fn ($p) => array_merge(
                    $p->only(['id', 'customer_notes', 'delivery_requested', 'delivery_address', 'status', 'staff_message', 'medicine_items', 'created_at']),
                    [
                        'image_url' => $p->image_url,
                        'messages' => $p->messages->map(fn ($m) => $m->only(['id', 'sender_type', 'message', 'created_at'])),
                    ]
                ));
        }

        return Inertia::render('customer-portal/prescriptions', [
            'customer' => $customer,
            'prescriptions' => $prescriptions,
        ]);
    }

    /**
     * Store a new prescription upload.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (! $customer) {
            return back()->withErrors(['error' => __('Customer profile not found. Please update your profile first.')]);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'notes' => 'nullable|string|max:1000',
            'delivery_requested' => 'boolean',
            'delivery_address' => 'nullable|string|max:1000',
        ]);

        $path = $request->file('image')->store('prescriptions', 'public');

        Prescription::create([
            'customer_id' => $customer->id,
            'image_path' => $path,
            'customer_notes' => $request->notes,
            'delivery_requested' => $request->boolean('delivery_requested'),
            'delivery_address' => $request->boolean('delivery_requested') ? $request->delivery_address : null,
            'status' => 'pending',
        ]);

        return back()->with('success', __('Prescription submitted successfully. The pharmacy will prepare your medicine shortly.'));
    }

    /**
     * Send a customer reply message on a prescription.
     */
    public function sendMessage(Request $request, Prescription $prescription): RedirectResponse
    {
        $user = auth()->user();
        $customer = Customer::where('user_id', $user->id)->first();

        abort_if(! $customer || $prescription->customer_id !== $customer->id, 403);

        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        PrescriptionMessage::create([
            'prescription_id' => $prescription->id,
            'sender_type' => 'customer',
            'message' => $request->message,
        ]);

        return back()->with('success', __('Message sent.'));
    }

    /**
     * Show the invoice for a prescription belonging to the authenticated customer.
     */
    public function invoice(Prescription $prescription): \Illuminate\Http\Response
    {
        $user = auth()->user();
        $customer = Customer::where('user_id', $user->id)->first();

        abort_if(! $customer || $prescription->customer_id !== $customer->id, 403);

        $prescription->load('customer');

        $deliveryCharge = (float) ($prescription->delivery_charge ?? 0);
        $lineItems = [];
        $subtotal = 0.0;

        foreach ($prescription->medicine_items ?? [] as $item) {
            if ($item['available'] ?? true) {
                $price = (float) ($item['price'] ?? 0);
                $qty = max(1, (int) ($item['quantity'] ?? 1));
                $displayName = ! empty($item['product_name']) ? $item['product_name'] : ($item['medicine_name'] ?? '');
                $lineItems[] = [
                    'name' => $displayName,
                    'note' => $item['note'] ?? '',
                    'qty' => $qty,
                    'price' => $price,
                    'subtotal' => $price * $qty,
                ];
                $subtotal += $price * $qty;
            } else {
                foreach ($item['alternatives'] ?? [] as $alt) {
                    $price = (float) ($alt['sale_price'] ?? 0);
                    $lineItems[] = [
                        'name' => $alt['name'],
                        'note' => 'Alternative for: '.($item['medicine_name'] ?? ''),
                        'qty' => 1,
                        'price' => $price,
                        'subtotal' => $price,
                    ];
                    $subtotal += $price;
                }
            }
        }

        $total = $subtotal + $deliveryCharge;

        $html = view('emails.prescription-invoice', [
            'prescription' => $prescription,
            'lineItems' => $lineItems,
            'subtotal' => $subtotal,
            'deliveryCharge' => $deliveryCharge,
            'total' => $total,
        ])->render();

        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }
}
