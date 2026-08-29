<?php

namespace App\Http\Requests;

use App\Enums\DiscountType;
use App\Enums\GrnStatus;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class GrnRequest extends FormRequest
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
            'grn_no' => 'required|string|max:255|unique:grns,grn_no,'.($this->route('grn')?->getKey() ?? 'NULL'),
            'batch_no' => 'nullable|string|max:255',
            'invoice_no' => 'nullable|string|max:255',
            'sup_id' => 'required|exists:suppliers,id',
            'branch_id' => 'nullable|exists:branches,id',
            'grn_date' => 'required|date',
            'sub_total' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|in:'.implode(',', GrnStatus::values()),
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|numeric|min:0',
            'items.*.free_qty' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.total_price' => 'nullable|numeric|min:0',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.discount_type' => 'nullable|in:none,'.implode(',', DiscountType::values()),
            'items.*.discount_value' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.batch_no' => 'nullable|string|max:255',
            'items.*.pack_size' => 'nullable|string|max:255',
            'items.*.sale_price' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Add after-validation checks for expiry_date requirement per product.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $items = $this->input('items', []);

                if (empty($items)) {
                    return;
                }

                $productIds = collect($items)->pluck('product_id')->filter()->unique()->values()->all();
                $products = Product::whereIn('id', $productIds)->pluck('has_expiry', 'id');

                foreach ($items as $index => $item) {
                    $productId = $item['product_id'] ?? null;

                    if (! $productId) {
                        continue;
                    }

                    $hasExpiry = $products->get($productId, true);

                    if ($hasExpiry && empty($item['expiry_date'])) {
                        $validator->errors()->add(
                            "items.{$index}.expiry_date",
                            __('The expiry date is required for this product.')
                        );
                    }
                }
            },
        ];
    }
}
