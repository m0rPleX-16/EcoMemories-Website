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
     * Generate a unique reference code like ECO-00124.
     */
    public static function generateReferenceCode(): string
    {
        $latest = DB::table('photos')->max('id') ?? 0;
        $next = $latest + 1;

        return 'ECO-' . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    public function photoSession(): BelongsTo
    {
        return $this->belongsTo(PhotoSession::class);
    }
}
