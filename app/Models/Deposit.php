<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deposit extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'device_id',
        'weight',
        'type',
        'status',
        'event_id',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_VALID = 'valid';
    const STATUS_INVALID = 'invalid';
    const STATUS_REJECTED = 'rejected';

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
