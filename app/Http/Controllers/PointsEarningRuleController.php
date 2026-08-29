<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePointsEarningRuleRequest;
use App\Models\PointsEarningRule;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PointsEarningRuleController extends Controller
{
    /**
     * Single-company rule configuration screen.
     */
    public function create(): Response
    {
        $companyId = createdBy();
        $rule = PointsEarningRule::query()->where('created_by', $companyId)->first();

        return Inertia::render('points-earning-rules/create', [
            'rule' => [
                'currency_amount' => $rule ? (string) $rule->currency_amount : '100',
                'points_earned' => $rule ? $rule->points_earned : 1,
                'redemption_points' => $rule ? $rule->redemption_points : 1,
                'redemption_amount' => $rule ? (string) $rule->redemption_amount : '1.00',
            ],
        ]);
    }

    public function store(StorePointsEarningRuleRequest $request): RedirectResponse
    {
        $companyId = createdBy();

        PointsEarningRule::query()->updateOrCreate(
            ['created_by' => $companyId],
            [
                'currency_amount' => round((float) $request->validated('currency_amount'), 2),
                'points_earned' => round((float) $request->validated('points_earned'), 2),
                'redemption_points' => round((float) $request->validated('redemption_points'), 2),
                'redemption_amount' => round((float) $request->validated('redemption_amount'), 2),
            ],
        );

        return redirect()
            ->route('points-rules.create')
            ->with('success', __('Points earning rule saved successfully.'));
    }
}
