<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use App\Models\Session;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PhotoSessionController extends Controller
{
    /**
     * Start a photo session (consumes 1 available credit).
     *
     * POST /api/sessions/{sessionCode}/photo-sessions
     */
    public function store(
        Request $request,
        string $sessionCode,
        TransactionService $transactionService,
    ): JsonResponse {
        $session = Session::where('session_code', $sessionCode)
            ->where('status', Session::STATUS_ACTIVE)
            ->firstOrFail();

        // Find an available credit
        $reward = $session->rewards()
            ->where('type', Reward::TYPE_PHOTO_CREDIT)
            ->where('status', Reward::STATUS_AVAILABLE)
            ->first();

        if (!$reward) {
            return response()->json([
                'success' => false,
                'error' => 'No available photo credits.',
            ], 422);
        }

        // Consume the credit
        $reward->consume();

        // Record credit consumption
        $transactionService->record($session, 'credit_consumed', $reward->id, [
            'type' => $reward->type,
            'amount' => $reward->amount,
        ]);

        // Create photo session
        $photoSession = $session->photoSessions()->create([
            'reward_id' => $reward->id,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'photo_session' => $photoSession,
        ], 201);
    }
}
