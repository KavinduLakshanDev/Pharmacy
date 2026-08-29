<?php

namespace App\Http\Requests;

use App\Enums\WastageStatus;
use App\Models\Wastage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WastageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $wastage = $this->route('wastage');
        $wastageId = $wastage instanceof Wastage ? $wastage->id : $wastage;

        return [
            'wastage_no' => ['required', 'string', 'max:255', Rule::unique('wastages', 'wastage_no')->ignore($wastageId)],
            'branch_id' => ['required', 'exists:branches,id'],
            'wastage_date' => ['required', 'date'],
            'status' => ['nullable', Rule::in(WastageStatus::values())],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.batch_no' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'At least one item is required.',
            'items.min' => 'At least one item is required.',
        ];
    }
}
