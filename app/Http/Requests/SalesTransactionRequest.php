<?php

namespace App\Http\Requests;

use App\Enums\SaleStatus;
use Illuminate\Foundation\Http\FormRequest;

class SalesTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'sale_no' => 'required|string|max:255|unique:sales_transactions,sale_no,'.($this->route('sales_transaction')?->id ?? 'NULL'),
            'customer_id' => [
                'nullable',
                'exists:customers,id',
                function ($attribute, $value, $fail) {
                    $paymentMethod = $this->input('payment_method');
                    if (in_array($paymentMethod, ['credit', 'cheque', 'bank_transfer'])) {
                        $customer = \App\Models\Customer::find($value);
                        if (! $customer || str_contains(strtolower($customer->name), 'walk-in')) {
                            $fail(__('A registered customer is required for :method payments.', ['method' => ucfirst(str_replace('_', ' ', $paymentMethod))]));
                        }
                    }
                },
            ],
            'branch_id' => 'nullable|exists:branches,id',
            'sale_date' => 'required|date',
            'sub_total' => 'nullable|numeric|min:0',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|string',
            'tax_amount' => 'nullable|numeric|min:0',
            'delivery_charge' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:255',
            'finance_account_id' => 'required_if:payment_method,card,bank_transfer|nullable|exists:finance_accounts,id',
            'cheque_no' => 'required_if:payment_method,cheque|nullable|string|max:255',
            'cheque_date' => 'required_if:payment_method,cheque|nullable|date',
            'cheque_bank' => 'required_if:payment_method,cheque|nullable|string|max:255',
            'cheque_branch' => 'required_if:payment_method,cheque|nullable|string|max:255',
            'status' => 'required|in:'.implode(',', SaleStatus::values()),
            'issued_by' => 'nullable|string|max:255',
            'checked_by' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.batch_no' => 'nullable|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_value' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',

            // Multi-payment support
            'payments' => 'nullable|array',
            'payments.*.payment_method' => 'required|string',
            'payments.*.amount' => 'required|numeric|min:0',
            'payments.*.finance_account_id' => 'nullable|exists:finance_accounts,id',
            'payments.*.cheque_no' => 'nullable|string',
            'payments.*.cheque_date' => 'nullable|date',
            'payments.*.cheque_bank' => 'nullable|string',
            'payments.*.cheque_branch' => 'nullable|string',

            // Points redemption support
            'points_redeemed' => 'nullable|numeric|min:0',
            'points_redeemed_amount' => 'nullable|numeric|min:0',
        ];
    }
}
