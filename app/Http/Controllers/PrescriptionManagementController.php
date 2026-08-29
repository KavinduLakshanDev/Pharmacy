<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionMessage;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionManagementController extends Controller
{
    /**
     * Display all prescription requests.
     */
    public function index(Request $request): Response
    {
        $query = Prescription::with(['customer:id,name,code,phone,email', 'messages']);

        if ($request->has('search') && $request->search !== null && trim($request->search) !== '') {
            $search = $request->search;
            $query->where(function ($subQuery) use ($search) {
                $subQuery->whereHas('customer', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });
        }

        if ($request->status && in_array($request->status, ['pending', 'processing', 'ready'])) {
            $query->where('status', $request->status);
        }

        $sortField = $request->get('sort_field', 'id');
        $sortDirection = $request->get('sort_direction', 'desc');
        $perPage = $request->get('per_page', 20);

        $prescriptions = $query->orderBy($sortField, $sortDirection)
            ->paginate($perPage)
            ->through(fn ($p) => array_merge(
                $p->only(['id', 'customer_notes', 'delivery_requested', 'delivery_address', 'delivery_charge', 'status', 'staff_message', 'medicine_items', 'created_at']),
                [
                    'image_url' => $p->image_url,
                    'customer' => $p->customer,
                    'messages' => $p->messages->map(fn ($m) => $m->only(['id', 'sender_type', 'message', 'created_at'])),
                ]
            ));

        return Inertia::render('prescriptions/index', [
            'prescriptions' => $prescriptions,
            'filters' => $request->only(['search', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    /**
     * Display a single prescription for editing.
     */
    public function show(Prescription $prescription): Response
    {
        $prescription->load(['customer:id,name,code,phone,email', 'messages']);

        $data = array_merge(
            $prescription->only(['id', 'customer_notes', 'delivery_requested', 'delivery_address', 'delivery_charge', 'status', 'staff_message', 'medicine_items', 'created_at']),
            [
                'image_url' => $prescription->image_url,
                'customer' => $prescription->customer,
                'messages' => $prescription->messages->map(fn ($m) => $m->only(['id', 'sender_type', 'message', 'created_at'])),
            ]
        );

        return Inertia::render('prescriptions/show', [
            'prescription' => $data,
        ]);
    }

    /**
     * Search products by generic name query for prescription alternative suggestions.
     */
    public function productsSearch(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim();

        $products = Product::with(['genericName:id,name', 'detailsPrices'])
            ->where('status', 'active')
            ->when($query->isNotEmpty(), function ($q) use ($query) {
                $q->whereHas('genericName', function ($gq) use ($query) {
                    $gq->where('name', 'like', "%{$query}%");
                })->orWhere('name', 'like', "%{$query}%");
            })
            ->select(['id', 'name', 'sku', 'generic_name_id'])
            ->limit(30)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'generic_name' => $p->genericName?->name,
                'sale_price' => $p->sale_price,
            ]);

        return response()->json($products);
    }

    /**
     * Update the status, staff message, and medicine items for a prescription.
     */
    public function update(Request $request, Prescription $prescription, \App\Services\SmsService $smsService): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:pending,processing,ready',
            'staff_message' => 'nullable|string|max:1000',
            'medicine_items' => 'nullable|array',
            'medicine_items.*.medicine_name' => 'nullable|string|max:255',
            'medicine_items.*.generic_name' => 'nullable|string|max:255',
            'medicine_items.*.available' => 'required|boolean',
            'medicine_items.*.product_id' => 'nullable|integer|exists:products,id',
            'medicine_items.*.product_name' => 'nullable|string|max:255',
            'medicine_items.*.quantity' => 'nullable|string|max:20',
            'medicine_items.*.price' => 'nullable|string|max:50',
            'medicine_items.*.alternatives' => 'nullable|array',
            'medicine_items.*.alternatives.*.id' => 'required|integer|exists:products,id',
            'medicine_items.*.alternatives.*.name' => 'required|string|max:255',
            'medicine_items.*.note' => 'nullable|string|max:500',
        ]);

        $oldStatus = $prescription->status;

        $prescription->update([
            'status' => $request->status,
            'staff_message' => $request->staff_message,
            'medicine_items' => $request->medicine_items ?? [],
            'updated_by' => auth()->id(),
        ]);

        // Send SMS notification when status is updated to 'ready'
        if ($request->status === 'ready' && $oldStatus !== 'ready') {
            $prescription->load('customer');
            if ($prescription->customer && $prescription->customer->phone) {
                $message = "Dear {$prescription->customer->name}, your prescription is ready for pickup at Unitec Pharmacy. Thank you!";
                $smsService->sendSms($prescription->customer->phone, $message);
            }
        }

        return back()->with('success', __('Prescription status updated.'));
    }

    /**
     * Generate and send an invoice to the customer via email.
     */
    /**
     * Render the invoice HTML for in-browser viewing.
     */
    public function viewInvoice(Prescription $prescription): \Illuminate\Http\Response
    {
        $prescription->load('customer');

        $lineItems = [];
        $subtotal = 0.0;
        $deliveryCharge = (float) ($prescription->delivery_charge ?? 0);

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

    public function generateInvoice(Request $request, Prescription $prescription): RedirectResponse
    {
        $request->validate([
            'delivery_charge' => 'nullable|numeric|min:0',
        ]);

        $prescription->load('customer');

        if (! $prescription->customer?->email) {
            return back()->with('error', __('Customer has no email address on file.'));
        }

        $deliveryCharge = (float) ($request->delivery_charge ?? 0);

        $prescription->update(['delivery_charge' => $deliveryCharge]);

        // Build line items from medicine_items
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

        $content = view('emails.prescription-invoice', [
            'prescription' => $prescription,
            'lineItems' => $lineItems,
            'subtotal' => $subtotal,
            'deliveryCharge' => $deliveryCharge,
            'total' => $total,
        ])->render();

        $fromEmail = getSetting('email_from_address') ?: config('mail.from.address');
        $fromName = getSetting('email_from_name') ?: config('app.name');
        $subject = __('Your Prescription Invoice').' #'.$prescription->id;

        \Illuminate\Support\Facades\Mail::to($prescription->customer->email)
            ->send(new \App\Mail\EmailTemplate($subject, $content, $fromEmail, $fromName));

        return back()->with('success', __('Invoice sent to :email successfully.', ['email' => $prescription->customer->email]));
    }

    /**
     * Send a pharmacist chat message on a prescription.
     */
    public function sendMessage(Request $request, Prescription $prescription): RedirectResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        PrescriptionMessage::create([
            'prescription_id' => $prescription->id,
            'sender_type' => 'pharmacist',
            'message' => $request->message,
        ]);

        return back()->with('success', __('Message sent.'));
    }
}
