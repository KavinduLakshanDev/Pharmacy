<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointsEarningRule extends Model
{
    protected $fillable = [
        'created_by',
        'currency_amount',
        'points_earned',
        'redemption_points',
        'redemption_amount',
    ];

    protected function casts(): array
    {
        return [
            'currency_amount' => 'decimal:2',
            'points_earned' => 'float',
            'redemption_points' => 'float',
            'redemption_amount' => 'decimal:2',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function forCompany(int $createdBy): ?self
    {
        return static::query()->where('created_by', $createdBy)->first();
    }

    /**
     * Whole points for a bill total using floor((amount / currency_amount) * points_earned).
     */
    public static function pointsForBillAmount(float $billTotal, int $createdBy): float
    {
        $rule = static::forCompany($createdBy);

        if (! $rule) {
            return 0.0;
        }

        $currencyAmount = (float) $rule->currency_amount;
        $pointsEarned = (float) $rule->points_earned;

        if ($currencyAmount <= 0 || $pointsEarned <= 0 || $billTotal <= 0) {
            return 0.0;
        }

        return floor(round(($billTotal / $currencyAmount) * $pointsEarned, 4) * 100) / 100;
    }

    /**
     * Convert points to cash value (Rs).
     */
    public static function pointsToCash(float $points, int $createdBy): float
    {
        $rule = static::forCompany($createdBy);

        if (! $rule) {
            return $points; // Fallback: 1 point = Rs 1.00
        }

        $redemptionPoints = (float) $rule->redemption_points;
        $redemptionAmount = (float) $rule->redemption_amount;

        if ($redemptionPoints <= 0) {
            return 0.0;
        }

        return round(($points / $redemptionPoints) * $redemptionAmount, 2);
    }

    /**
     * Convert cash value (Rs) to points needed.
     */
    public static function cashToPoints(float $cashAmount, int $createdBy): float
    {
        $rule = static::forCompany($createdBy);

        if (! $rule) {
            return $cashAmount; // Fallback: Rs 1.00 = 1 point
        }

        $redemptionPoints = (float) $rule->redemption_points;
        $redemptionAmount = (float) $rule->redemption_amount;

        if ($redemptionAmount <= 0) {
            return 0.0;
        }

        return round(($cashAmount / $redemptionAmount) * $redemptionPoints, 2);
    }
}
