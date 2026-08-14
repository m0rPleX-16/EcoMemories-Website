<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reward extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'type',
        'amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    // Status constants
    const STATUS_AVAILABLE = 'available';
    const STATUS_CONSUMED = 'consumed';
    const STATUS_EXPIRED = 'expired';

    // Type constants
    const TYPE_PHOTO_CREDIT = 'photo_credit';

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }

    /**
     * Consume this reward (mark as used).
     */
    public function consume(): void
    {
        $this->update(['status' => self::STATUS_CONSUMED]);
    }
}
