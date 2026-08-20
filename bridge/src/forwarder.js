'use strict';

const axios = require('axios');
const { getActiveSession } = require('./server');

// ─── Configuration ────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a unique event ID for idempotency (README §13).
 * Format: evt-<timestamp ms>-<6 random hex chars>
 * @returns {string}
 */
function generateEventId() {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');
    return `evt-${ts}-${rand}`;
}

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Forwarder ────────────────────────────────────────────────────────────────

/**
 * Build and POST a deposit event to Laravel's device event API.
 * Implements the contract from README §11:
 *   POST /api/devices/events
 *   { device_id, event, event_id, session_code, weight? }
 *
 * Retries up to MAX_RETRIES times on failure with RETRY_DELAY_MS between attempts.
 *
 * @param {{ event: string, weight: number|null }} parsedEvent
 * @returns {Promise<object>} The Laravel response data on success.
 * @throws {Error} After all retries are exhausted.
 */
async function handleEvent(parsedEvent) {
    const sessionCode = getActiveSession();

    if (!sessionCode) {
        console.warn('[forwarder] ⚠ No active session — deposit discarded.');
        console.warn('[forwarder]   Start a session in the kiosk before deposits are accepted.');
        return null;
    }

    const laravelUrl = process.env.LARAVEL_URL || 'http://localhost:8000';
    const deviceId   = process.env.DEVICE_ID   || 'ARDUINO-001';
    const secret     = process.env.DEVICE_SECRET || '';

    const payload = {
        device_id:    deviceId,
        event:        parsedEvent.event,
        event_id:     generateEventId(),
        session_code: sessionCode,
        weight:       parsedEvent.weight ?? null,
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept':        'application/json',
    };

    if (secret) {
        headers['X-Device-Secret'] = secret;
    }

    console.log(`[forwarder] → Forwarding deposit | session: ${sessionCode} | event_id: ${payload.event_id}`);

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios.post(
                `${laravelUrl}/api/devices/events`,
                payload,
                { headers, timeout: 8000 }
            );

            const { data } = response;

            if (data.success) {
                const { deposits, required, credits } = data.session;
                console.log(
                    `[forwarder] ✓ Deposit forwarded | deposits: ${deposits}/${required} | credits: ${credits}`
                );
                if (data.reward_earned) {
                    console.log('[forwarder] 🎉 Photo credit earned!');
                }
            } else {
                console.warn(`[forwarder] ⚠ Laravel responded with success: false`);
            }

            return data;
        } catch (err) {
            lastError = err;
            const status = err.response?.status;
            const message = err.response?.data?.error || err.message;

            // 409 = duplicate event_id — not a real error, discard silently.
            if (status === 409) {
                console.warn(`[forwarder] ⚠ Duplicate event_id detected — discarding (${payload.event_id})`);
                return null;
            }

            // 401/403 = auth failure — retrying won't help.
            if (status === 401 || status === 403) {
                console.error(`[forwarder] ✗ Auth error (${status}): ${message}`);
                console.error('[forwarder]   Check DEVICE_ID and DEVICE_SECRET in bridge/.env');
                throw err;
            }

            // 404 = session not found — retrying won't help.
            if (status === 404) {
                console.error(`[forwarder] ✗ Session "${sessionCode}" not found or inactive (404)`);
                throw err;
            }

            console.warn(
                `[forwarder] ✗ Attempt ${attempt}/${MAX_RETRIES} failed: ${message}` +
                (attempt < MAX_RETRIES ? ` — retrying in ${RETRY_DELAY_MS / 1000}s...` : '')
            );

            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    console.error(`[forwarder] ✗ All ${MAX_RETRIES} attempts failed. Event discarded.`);
    throw lastError;
}

module.exports = { handleEvent };
