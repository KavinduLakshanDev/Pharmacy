<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePointsEarningRuleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->can('manage-points-earning-rules') || $user->can('manage-sales');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'currency_amount' => ['required', 'numeric', 'min:0.01'],
            'points_earned' => ['required', 'numeric', 'min:0.01'],
            'redemption_points' => ['required', 'numeric', 'min:0.01'],
            'redemption_amount' => ['required', 'numeric', 'min:0.01'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'currency_amount.required' => __('The currency amount is required.'),
            'currency_amount.min' => __('The currency amount must be at least :min.'),
            'points_earned.required' => __('The points earned value is required.'),
            'points_earned.min' => __('Award at least :min point(s).'),
            'redemption_points.required' => __('The redemption points value is required.'),
            'redemption_points.min' => __('The redemption points must be at least :min.'),
            'redemption_amount.required' => __('The redemption amount value is required.'),
            'redemption_amount.min' => __('The redemption amount must be at least :min.'),
        ];
    }
}
