<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'type',
        'reference_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    // Type constants
    const TYPE_DEPOSIT_RECORDED = 'deposit_recorded';
    const TYPE_REWARD_EARNED = 'reward_earned';
    const TYPE_CREDIT_CONSUMED = 'credit_consumed';
    const TYPE_PHOTO_CREATED = 'photo_created';
    const TYPE_PRINT_REQUESTED = 'print_requested';

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }
}
