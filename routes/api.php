<?php

use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\DeviceEventController;
use App\Http\Controllers\Api\PhotoSessionController;
use App\Http\Controllers\Api\PhotoController;
use Illuminate\Support\Facades\Route;

// Sessions
Route::post('/sessions', [SessionController::class, 'store']);
Route::get('/sessions/{sessionCode}', [SessionController::class, 'show']);

// Deposits (simplified simulator shortcut)
Route::post('/sessions/{sessionCode}/deposits', [DepositController::class, 'store']);

// Device Events (the real device-facing endpoint per README §11)
Route::post('/devices/events', [DeviceEventController::class, 'store']);

// Photo Sessions
Route::post('/sessions/{sessionCode}/photo-sessions', [PhotoSessionController::class, 'store']);

// Photos
Route::post('/sessions/{sessionCode}/photo-sessions/{photoSessionId}/photos', [PhotoController::class, 'store']);
Route::get('/photos/{reference}', [PhotoController::class, 'show']);
