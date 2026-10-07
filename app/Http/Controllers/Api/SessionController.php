<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Services\RewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * Create a new photobooth session.
     *
     * POST /api/sessions
     */
    public function store(Request $request): JsonResponse
    {
        $session = Session::create([
            'session_code' => Session::generateCode(),
            'status' => Session::STATUS_ACTIVE,
            'expires_at' => now()->addHours(2),
        ]);

        $this->notifyBridgeSession($session->session_code);

        return response()->json([
            'success' => true,
            'session' => $this->formatSession($session),
        ], 201);
    }

    /**
     * Get session details with deposits, rewards, and credits.
     *
     * GET /api/sessions/{sessionCode}
     */
    public function show(string $sessionCode): JsonResponse
    {
        $session = Session::where('session_code', $sessionCode)
            ->with(['deposits', 'rewards', 'photoSessions.photo'])
            ->firstOrFail();

        $this->notifyBridgeSession($session->session_code);

        return response()->json([
            'success' => true,
            'session' => $this->formatSession($session),
        ]);
    }

    /**
     * Notify the ESP32 hardware bridge of the active session code.
     */
    private function notifyBridgeSession(string $sessionCode): void
    {
        $cachedIp = cache()->get('esp32_bridge_ip');
        $bridgeUrl = $cachedIp
            ? (str_starts_with($cachedIp, 'http') ? $cachedIp : "http://{$cachedIp}:3333")
            : env('VITE_BRIDGE_URL', 'http://192.168.1.8:3333');
        $eventUrl = url('/api/devices/events');

        try {
            \Illuminate\Support\Facades\Http::timeout(1)->post("{$bridgeUrl}/session", [
                'session_code' => $sessionCode,
                'event_url' => $eventUrl,
            ]);
        } catch (\Throwable $e) {
            // Best effort
        }
    }

    /**
     * Format session data for API response.
     */
    private function formatSession(Session $session): array
    {
        return [
            'id' => $session->id,
            'session_code' => $session->session_code,
            'status' => $session->status,
            'deposits' => $session->deposits ?? [],
            'rewards' => $session->rewards ?? [],
            'photo_sessions' => $session->photoSessions ?? [],
            'valid_deposits_count' => $session->validDepositsCount(),
            'available_credits' => $session->availableCredits(),
            'required_deposits' => RewardService::REQUIRED_DEPOSITS,
            'created_at' => $session->created_at,
            'expires_at' => $session->expires_at,
        ];
    }
}
