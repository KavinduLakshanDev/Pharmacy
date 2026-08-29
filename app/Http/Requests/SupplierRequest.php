<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupplierRequest extends FormRequest
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
            'company_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'tel_no' => ['required', 'regex:/^(\+\d{11}|\d{10})$/'],
            'mail' => 'required|email|max:255',
            'website' => 'nullable|url|max:255',
            'vat_registered' => 'required|in:'.implode(',', \App\Enums\VatRegistrationStatus::values()),
            'vat_no' => 'nullable|string|max:255|required_if:vat_registered,registered',
            'contact_person_name' => 'nullable|string|max:255',
            'contact_no' => ['required', 'regex:/^(\+\d{11}|\d{10})$/'],
        ];
    }
}
