<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Photo extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'photo_session_id',
        'storage_path',
        'public_url',
        'reference_code',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /**
     * Generate a cryptographically unguessable reference code like ECO-8M4K2P.
     * Uses unambiguous characters (no 0/O, 1/I).
     */
    public static function generateReferenceCode(): string
    {
        $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        $length = 6;

        do {
            $code = 'ECO-';
            for ($i = 0; $i < $length; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }
        } while (self::where('reference_code', $code)->exists());

        return $code;
    }

    public function photoSession(): BelongsTo
    {
        return $this->belongsTo(PhotoSession::class);
    }
}
