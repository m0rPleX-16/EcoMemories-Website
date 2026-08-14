<?php

namespace App\Services;

use App\Models\Deposit;
use App\Models\Reward;
use App\Models\Session;

class RewardService
{
    /**
     * Number of valid deposits required per reward.
     */
    const REQUIRED_DEPOSITS = 5;

    /**
     * Reward type to issue.
     */
    const REWARD_TYPE = 'photo_credit';

    /**
     * Reward amount per threshold.
     */
    const REWARD_AMOUNT = 1;

    /**
     * Evaluate whether a session has earned new rewards based on valid deposit count.
     *
     * Logic: for every REQUIRED_DEPOSITS valid deposits, one reward should exist.
     * If the session has more valid deposits than covered by existing rewards,
     * create the missing reward(s).
     */
    public function evaluateDeposits(Session $session): ?Reward
    {
        $validDeposits = $session->deposits()
            ->where('status', Deposit::STATUS_VALID)
            ->count();

        $existingRewards = $session->rewards()->count();

        // How many total rewards should exist for this deposit count
        $expectedRewards = intdiv($validDeposits, self::REQUIRED_DEPOSITS);

        // Already awarded enough
        if ($existingRewards >= $expectedRewards) {
            return null;
        }

        // Create new reward
        $reward = $session->rewards()->create([
            'type' => self::REWARD_TYPE,
            'amount' => self::REWARD_AMOUNT,
            'status' => Reward::STATUS_AVAILABLE,
        ]);

        // Audit trail
        app(TransactionService::class)->record(
            $session,
            'reward_earned',
            $reward->id,
            [
                'type' => self::REWARD_TYPE,
                'amount' => self::REWARD_AMOUNT,
                'deposit_count' => $validDeposits,
                'threshold' => self::REQUIRED_DEPOSITS,
            ]
        );

        return $reward;
    }
}
