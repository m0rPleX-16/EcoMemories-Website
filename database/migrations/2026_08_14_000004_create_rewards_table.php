<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('booth_sessions')->cascadeOnDelete();
            $table->string('type')->default('photo_credit');  // photo_credit, special_frame, etc.
            $table->integer('amount')->default(1);
            $table->string('status')->default('available');    // available, consumed, expired
            $table->timestamp('created_at')->useCurrent();

            $table->index(['session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
};
