<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('booth_sessions')->cascadeOnDelete();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->decimal('weight', 8, 2)->nullable();
            $table->string('type')->nullable();           // plastic, metal, paper, etc.
            $table->string('status')->default('pending');  // pending, valid, invalid, rejected
            $table->string('event_id')->unique();          // idempotency key from device
            $table->timestamp('created_at')->useCurrent();

            $table->index(['session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
