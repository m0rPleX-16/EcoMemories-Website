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

        return response()->json([
            'success' => true,
            'session' => $this->formatSession($session),
        ]);
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
