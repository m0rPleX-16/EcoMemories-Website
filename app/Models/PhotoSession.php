<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PhotoSession extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'reward_id',
        'status',
        'photo_id',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    // Status constants
    const STATUS_ACTIVE = 'active';
    const STATUS_CAPTURED = 'captured';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function reward(): BelongsTo
    {
        return $this->belongsTo(Reward::class);
    }

    public function photo(): HasOne
    {
        return $this->hasOne(Photo::class);
    }

    public function complete(Photo $photo): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'photo_id' => $photo->id,
            'completed_at' => now(),
        ]);
    }
}
