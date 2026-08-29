<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanySettingsController extends Controller
{
    /**
     * Update the company information settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $userId = auth()->id();

        $request->validate([
            'companyName' => 'required|string|max:255',
            'companyPhone' => 'nullable|string|max:255',
            'companyAddress' => 'nullable|string',
            'companyLogo' => 'nullable|string', // Accept string from MediaPicker
        ]);

        updateSetting('companyName', $request->companyName, $userId);
        updateSetting('companyPhone', $request->companyPhone, $userId);
        updateSetting('companyAddress', $request->companyAddress, $userId);

        if ($request->has('companyLogo')) {
            $logoPath = $request->companyLogo;

            // If it's a full URL, we might want to store only the path
            if (str_starts_with($logoPath, config('app.url'))) {
                $logoPath = str_replace(config('app.url'), '', $logoPath);
            }
            // Strip /storage/ prefix if present to keep it consistent with other settings
            if (str_starts_with($logoPath, '/storage/')) {
                $logoPath = str_replace('/storage/', '', $logoPath);
            }

            updateSetting('companyLogo', $logoPath, $userId);
        }

        return redirect()->back()->with('success', __('Company settings updated successfully.'));
    }
}
