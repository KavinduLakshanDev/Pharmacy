<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an SMS message using the Bees SMS gateway.
     *
     * @param string $to The recipient's phone number.
     * @param string $message The message content.
     * @return bool True if the SMS was sent successfully, false otherwise.
     */
    public function sendSms(string $to, string $message): bool
    {
        $apiUrl = config('services.bees_sms.api_url');
        $token = config('services.bees_sms.token');
        $senderId = config('services.bees_sms.sender_id');

        if (!$apiUrl || !$token) {
            Log::error('SMS service not configured. Please check SMS_BEARER_TOKEN and SMS_API_URL in .env');
            return false;
        }

        try {
            // Normalize phone number: remove all non-digits
            $to = preg_replace('/[^0-9]/', '', $to);

            // Ensure Sri Lankan numbers have the 94 prefix (077... -> 9477...)
            if (str_starts_with($to, '0')) {
                $to = '94' . substr($to, 1);
            } elseif (!str_starts_with($to, '94') && strlen($to) == 9) {
                $to = '94' . $to;
            }

            Log::info('Attempting to send SMS via Bees SMS', ['to' => $to, 'sender_id' => $senderId]);

            // Based on common Sri Lankan SMS gateway patterns for JSON APIs
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post($apiUrl, [
                'To' => $to,
                'From' => $senderId,
                'Text' => $message,
            ]);

            if ($response->successful()) {
                Log::info('SMS sent successfully via Bees SMS', ['to' => $to]);
                return true;
            }

            Log::error('SMS sending failed via Bees SMS', [
                'status' => $response->status(),
                'body' => $response->body(),
                'to' => $to,
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('SMS sending exception via Bees SMS', [
                'message' => $e->getMessage(),
                'to' => $to,
            ]);
            return false;
        }
    }
}
