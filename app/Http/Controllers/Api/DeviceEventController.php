<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\Device;
use App\Models\Session;
use App\Services\RewardService;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceEventController extends Controller
{
    /**
     * Handle device events (the real device-facing endpoint).
     *
     * POST /api/devices/events
     *
     * This implements README §11 — Device Event API.
     */
    public function store(
        Request $request,
        RewardService $rewardService,
        TransactionService $transactionService,
    ): JsonResponse {
        $validated = $request->validate([
            'device_id' => 'required|string',
            'event' => 'required|string|in:deposit',
            'event_id' => 'required|string',
            'session_code' => 'required|string',
            'weight' => 'nullable|numeric|min:0',
        ]);

        // 1. Authenticate device and optional secret key
        $configuredSecret = config('services.device_secret', env('DEVICE_SECRET'));
        if ($configuredSecret) {
            $providedSecret = $request->header('X-Device-Secret');
            if (!$providedSecret || !hash_equals($configuredSecret, $providedSecret)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized device secret.',
                ], 401);
            }
        }

        $device = Device::where('device_code', $validated['device_id'])
            ->where('status', Device::STATUS_ACTIVE)
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'error' => 'Device not found or inactive.',
            ], 403);
        }

        // 2. Check duplicate event_id (idempotency per README §13)
        if (Deposit::where('event_id', $validated['event_id'])->exists()) {
            return response()->json([
                'success' => false,
                'error' => 'Duplicate event ID.',
            ], 409);
        }

        // 3. Validate session
        $session = Session::where('session_code', $validated['session_code'])
            ->where('status', Session::STATUS_ACTIVE)
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'error' => 'Session not found or inactive.',
            ], 404);
        }

        // 4. Record deposit
        $deposit = $session->deposits()->create([
            'device_id' => $device->id,
            'weight' => $validated['weight'] ?? null,
            'status' => 'valid',
            'event_id' => $validated['event_id'],
        ]);

        // 5. Update device last seen
        $device->update(['last_seen_at' => now()]);

        // 6. Audit trail
        $transactionService->record($session, 'deposit_recorded', $deposit->id, [
            'device' => $device->device_code,
            'weight' => $deposit->weight,
        ]);

        // 7. Run reward logic
        $reward = $rewardService->evaluateDeposits($session);

        // 8. Return updated state
        return response()->json([
            'success' => true,
            'deposit' => [
                'id' => $deposit->id,
                'status' => $deposit->status,
            ],
            'reward_earned' => $reward !== null,
            'session' => [
                'deposits' => $session->validDepositsCount(),
                'required' => RewardService::REQUIRED_DEPOSITS,
                'credits' => $session->availableCredits(),
            ],
        ]);
    }
}
