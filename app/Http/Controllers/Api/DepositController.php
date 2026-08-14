<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Session;
use App\Services\RewardService;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DepositController extends Controller
{
    /**
     * Simulate a deposit for a session (development shortcut).
     *
     * POST /api/sessions/{sessionCode}/deposits
     *
     * This is the simplified simulator endpoint. The real device endpoint
     * is POST /api/devices/events (DeviceEventController).
     */
    public function store(
        Request $request,
        string $sessionCode,
        RewardService $rewardService,
        TransactionService $transactionService,
    ): JsonResponse {
        $session = Session::where('session_code', $sessionCode)
            ->where('status', Session::STATUS_ACTIVE)
            ->firstOrFail();

        $device = Device::where('device_code', 'SIMULATOR-001')->firstOrFail();

        // Create deposit
        $deposit = $session->deposits()->create([
            'device_id' => $device->id,
            'status' => 'valid',
            'event_id' => 'sim-' . Str::uuid(),
            'weight' => $request->input('weight', round(mt_rand(50, 500) / 10, 2)),
        ]);

        // Audit trail
        $transactionService->record($session, 'deposit_recorded', $deposit->id, [
            'device' => $device->device_code,
            'simulated' => true,
        ]);

        // Evaluate rewards
        $reward = $rewardService->evaluateDeposits($session);

        return response()->json([
            'success' => true,
            'deposit' => $deposit,
            'reward_earned' => $reward !== null,
            'session' => [
                'deposits' => $session->validDepositsCount(),
                'required' => RewardService::REQUIRED_DEPOSITS,
                'credits' => $session->availableCredits(),
            ],
        ]);
    }
}
