<?php

use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\DeviceEventController;
use App\Http\Controllers\Api\PhotoSessionController;
use App\Http\Controllers\Api\PhotoController;
use Illuminate\Support\Facades\Route;

// High-throughput rate limit (300 req/min) for real-time kiosk hardware & UI polling
Route::middleware('throttle:300,1')->group(function () {
    // Sessions
    Route::post('/sessions', [SessionController::class, 'store']);
    Route::get('/sessions/{sessionCode}', [SessionController::class, 'show']);

    // Deposits (simplified simulator shortcut)
    Route::post('/sessions/{sessionCode}/deposits', [DepositController::class, 'store']);

    // Device Events (the real device-facing endpoint per README §11)
    Route::post('/devices/events', [DeviceEventController::class, 'store']);
    Route::post('/devices/announce', function (\Illuminate\Http\Request $request) {
        $ip = $request->input('ip', $request->ip());
        cache()->put('esp32_bridge_ip', $ip, now()->addDays(7));
        \Illuminate\Support\Facades\Log::info("[ESP32] Device auto-registered at IP: {$ip}");
        return response()->json(['success' => true, 'registered_ip' => $ip]);
    });
    Route::get('/devices/active-session', function () {
        $cached = cache()->get('kiosk_active_session');
        if (is_array($cached) && !empty($cached['session_code']) && ($cached['deposits'] ?? 0) < 5) {
            return response()->json([
                'active' => true,
                'session_code' => $cached['session_code'],
                'deposits' => $cached['deposits'],
                'required' => 5,
            ]);
        }

        $session = \App\Models\Session::where('status', \App\Models\Session::STATUS_ACTIVE)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if ($session && $session->validDepositsCount() < 5) {
            $data = [
                'session_code' => $session->session_code,
                'deposits' => $session->validDepositsCount(),
                'required' => 5,
            ];
            cache()->put('kiosk_active_session', $data, now()->addMinutes(10));
            return response()->json([
                'active' => true,
                'session_code' => $data['session_code'],
                'deposits' => $data['deposits'],
                'required' => 5,
            ]);
        }

        cache()->forget('kiosk_active_session');
        return response()->json([
            'active' => false,
            'session_code' => '',
            'deposits' => 0,
            'required' => 5,
        ]);
    });

    Route::get('/devices/bridge-status', function () {
        $ip = cache()->get('esp32_bridge_ip') ?? env('VITE_BRIDGE_URL');
        $url = $ip ? (str_starts_with($ip, 'http') ? $ip : "http://{$ip}:3333") : 'http://localhost:3333';
        return response()->json(['bridge_url' => $url]);
    });

    // Photo Sessions
    Route::post('/sessions/{sessionCode}/photo-sessions', [PhotoSessionController::class, 'store']);

    // Photos
    Route::post('/sessions/{sessionCode}/photo-sessions/{photoSessionId}/photos', [PhotoController::class, 'store']);
    Route::get('/photos/{reference}', [PhotoController::class, 'show']);
    Route::delete('/photos/{reference}', [PhotoController::class, 'destroy']);
});
