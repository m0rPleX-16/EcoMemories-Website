<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Models\PhotoSession;
use App\Models\Session;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    /**
     * Upload a photo for a photo session.
     *
     * POST /api/sessions/{sessionCode}/photo-sessions/{photoSessionId}/photos
     *
     * Accepts base64-encoded image data.
     */
    public function store(
        Request $request,
        string $sessionCode,
        int $photoSessionId,
        TransactionService $transactionService,
    ): JsonResponse {
        $request->validate([
            'image' => 'required|string',
        ]);

        $session = Session::where('session_code', $sessionCode)->firstOrFail();

        $photoSession = PhotoSession::where('id', $photoSessionId)
            ->where('session_id', $session->id)
            ->whereIn('status', ['active', 'captured'])
            ->firstOrFail();

        // Decode base64 image
        $imageData = $request->input('image');
        $imageData = preg_replace('/^data:image\/\w+;base64,/', '', $imageData);
        $imageData = base64_decode($imageData);

        if ($imageData === false) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid image data.',
            ], 422);
        }

        // Generate reference code and storage path
        $referenceCode = Photo::generateReferenceCode();
        $date = now();
        $storagePath = sprintf(
            'photos/%s/%s/%s.jpg',
            $date->format('Y'),
            $date->format('m'),
            $referenceCode
        );

        // Store to disk
        Storage::disk('public')->put($storagePath, $imageData);

        // Create photo record
        $photo = Photo::create([
            'photo_session_id' => $photoSession->id,
            'storage_path' => $storagePath,
            'public_url' => Storage::disk('public')->url($storagePath),
            'reference_code' => $referenceCode,
        ]);

        // Complete the photo session
        $photoSession->complete($photo);

        // Audit trail
        $transactionService->record($session, 'photo_created', $photo->id, [
            'reference_code' => $referenceCode,
            'photo_session_id' => $photoSession->id,
        ]);

        return response()->json([
            'success' => true,
            'photo' => $photo,
            'photo_session' => $photoSession->fresh(),
        ], 201);
    }

    /**
     * Get a photo by reference code.
     *
     * GET /api/photos/{reference}
     */
    public function show(string $reference): JsonResponse
    {
        $photo = Photo::where('reference_code', $reference)
            ->with('photoSession.session')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'photo' => $photo,
        ]);
    }

    /**
     * Delete a photo by reference code (GDPR Right to Erasure / Privacy Compliance).
     *
     * DELETE /api/photos/{reference}
     */
    public function destroy(string $reference, TransactionService $transactionService): JsonResponse
    {
        $photo = Photo::where('reference_code', $reference)->firstOrFail();

        // Delete physical file from storage disk if exists
        if ($photo->storage_path && Storage::disk('public')->exists($photo->storage_path)) {
            Storage::disk('public')->delete($photo->storage_path);
        }

        // Record audit transaction before deleting
        if ($photo->photoSession && $photo->photoSession->session) {
            $transactionService->record(
                $photo->photoSession->session,
                'photo_deleted_by_user_request',
                $photo->id,
                ['reference_code' => $reference]
            );
        }

        $photo->delete();

        return response()->json([
            'success' => true,
            'message' => "Photo {$reference} has been permanently deleted in accordance with data privacy regulations.",
        ]);
    }
}
