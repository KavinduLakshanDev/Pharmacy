@php
    $currencySymbol = getSetting('currency_symbol', '$');
    $formatMoney = fn(float $v) => $currencySymbol . number_format($v, 2);
@endphp

<div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
    <h2 style="color: #1a56db; margin-bottom: 4px;">Prescription Invoice</h2>
    <p style="color: #6b7280; margin-top: 0;">Invoice for Prescription <strong>#{{ $prescription->id }}</strong></p>

    {{-- Customer Details --}}
    <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
        <tr>
            <td style="padding: 4px 0; width: 140px; color: #6b7280;">Customer:</td>
            <td style="padding: 4px 0; font-weight: 600;">{{ $prescription->customer->name }}</td>
        </tr>
        @if($prescription->customer->phone)
        <tr>
            <td style="padding: 4px 0; color: #6b7280;">Phone:</td>
            <td style="padding: 4px 0;">{{ $prescription->customer->phone }}</td>
        </tr>
        @endif
        @if($prescription->customer->email)
        <tr>
            <td style="padding: 4px 0; color: #6b7280;">Email:</td>
            <td style="padding: 4px 0;">{{ $prescription->customer->email }}</td>
        </tr>
        @endif
        <tr>
            <td style="padding: 4px 0; color: #6b7280;">Date:</td>
            <td style="padding: 4px 0;">{{ now()->format('d M Y') }}</td>
        </tr>
        @if($prescription->delivery_requested && $prescription->delivery_address)
        <tr>
            <td style="padding: 4px 0; color: #6b7280;">Delivery Address:</td>
            <td style="padding: 4px 0;">{{ $prescription->delivery_address }}</td>
        </tr>
        @endif
    </table>

    {{-- Line Items --}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
            <tr style="background-color: #f3f4f6;">
                <th style="text-align: left; padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-transform: uppercase;">Medicine / Item</th>
                <th style="text-align: left; padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-transform: uppercase;">Note</th>
                <th style="text-align: center; padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-transform: uppercase;">Qty</th>
                <th style="text-align: right; padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-transform: uppercase;">Unit Price</th>
                <th style="text-align: right; padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-transform: uppercase;">Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse($lineItems as $item)
            <tr>
                <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">{{ $item['name'] }}</td>
                <td style="padding: 8px 10px; border: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">{{ $item['note'] ?: '-' }}</td>
                <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center;">{{ $item['qty'] ?? 1 }}</td>
                <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: right;">{{ $formatMoney($item['price']) }}</td>
                <td style="padding: 8px 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">{{ $formatMoney($item['subtotal'] ?? $item['price']) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="padding: 8px 10px; border: 1px solid #e5e7eb; color: #6b7280; text-align: center;">No items listed.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Totals --}}
    <table style="width: 100%; border-collapse: collapse; max-width: 320px; margin-left: auto;">
        <tr>
            <td style="padding: 6px 10px; color: #6b7280;">Subtotal</td>
            <td style="padding: 6px 10px; text-align: right;">{{ $formatMoney($subtotal) }}</td>
        </tr>
        @if($deliveryCharge > 0)
        <tr>
            <td style="padding: 6px 10px; color: #6b7280;">Delivery Charge</td>
            <td style="padding: 6px 10px; text-align: right;">{{ $formatMoney($deliveryCharge) }}</td>
        </tr>
        @endif
        <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: 700; font-size: 15px;">Total</td>
            <td style="padding: 8px 10px; font-weight: 700; font-size: 15px; text-align: right; color: #1a56db;">{{ $formatMoney($total) }}</td>
        </tr>
    </table>

    @if($prescription->staff_message)
    <div style="margin-top: 20px; padding: 12px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #15803d;">Message from Pharmacist</p>
        <p style="margin: 0; color: #166534;">{{ $prescription->staff_message }}</p>
    </div>
    @endif

    <p style="margin-top: 24px; font-size: 13px; color: #9ca3af;">
        Thank you for choosing {{ config('app.name') }}. Please contact us if you have any questions.
    </p>
</div>
