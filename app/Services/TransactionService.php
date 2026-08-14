<?php

namespace App\Services;

use App\Models\Session;
use App\Models\Transaction;

class TransactionService
{
    /**
     * Record an audit trail entry for a session event.
     */
    public function record(
        Session $session,
        string $type,
        ?int $referenceId = null,
        ?array $metadata = null
    ): Transaction {
        return $session->transactions()->create([
            'type' => $type,
            'reference_id' => $referenceId,
            'metadata' => $metadata,
        ]);
    }
}
