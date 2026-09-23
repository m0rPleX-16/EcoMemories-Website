'use strict';

const express = require('express');
const cors = require('cors');

const app = express();
const startTime = Date.now();

// ─── Internal State ──────────────────────────────────────────────────────────

let activeSessionCode = null;
let serialConnected = false;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /status
 * Returns bridge health, serial connection state, and active session.
 * Polled by the React kiosk to show the hardware status badge.
 */
app.get('/status', (req, res) => {
    res.json({
        active: activeSessionCode !== null,
        session_code: activeSessionCode,
        device_id: process.env.DEVICE_ID || 'ARDUINO-001',
        serial_connected: serialConnected,
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    });
});

/**
 * POST /session
 * Body: { session_code: "ABC123" }
 * Called by the React kiosk when a session page is opened.
 * Registers the active session so deposits are credited to it.
 */
app.post('/session', (req, res) => {
    const { session_code } = req.body;

    if (!session_code || typeof session_code !== 'string' || session_code.trim() === '') {
        return res.status(422).json({
            success: false,
            error: 'session_code is required and must be a non-empty string.',
        });
    }

    activeSessionCode = session_code.trim().toUpperCase();
    console.log(`[bridge] ✓ Active session registered: ${activeSessionCode}`);

    res.json({
        success: true,
        session_code: activeSessionCode,
    });
});

/**
 * DELETE /session
 * Called by the React kiosk when the user leaves the session page.
 * Clears the active session so stray deposits are not credited.
 */
app.delete('/session', (req, res) => {
    const previous = activeSessionCode;
    activeSessionCode = null;
    console.log(`[bridge] Session cleared (was: ${previous ?? 'none'})`);

    res.json({ success: true });
});

/**
 * POST /print
 * Body: { reference_code, photo_url, session_code, items_recycled }
 * Called when the photobooth completes a session to print thermal souvenir ticket.
 */
app.post('/print', (req, res) => {
    const { reference_code, photo_url, session_code, items_recycled = 5 } = req.body || {};
    console.log('\n[bridge] ══════════ THERMAL RECEIPT PRINT JOB ══════════');
    console.log(`[bridge] Reference:      ${reference_code || 'N/A'}`);
    console.log(`[bridge] Session:        ${session_code || activeSessionCode || 'N/A'}`);
    console.log(`[bridge] Items Recycled: ${items_recycled}`);
    console.log(`[bridge] QR Code Target: ${photo_url || 'N/A'}`);
    console.log('[bridge] ═══════════════════════════════════════════════\n');

    res.json({ success: true, printed: true });
});

// ─── Exports ─────────────────────────────────────────────────────────────────

/**
 * Start the Express server on the configured port.
 * @param {number} port
 * @returns {import('http').Server}
 */
function startServer(port) {
    return app.listen(port, () => {
        console.log(`[bridge] ✓ HTTP server running on port ${port}`);
    });
}

/**
 * Get the currently active session code, or null if none is registered.
 * Called by the forwarder before building a deposit payload.
 * @returns {string|null}
 */
function getActiveSession() {
    return activeSessionCode;
}

/**
 * Update the serial connection status reflected in GET /status.
 * Called by the serial module when the port opens or closes.
 * @param {boolean} connected
 */
function setSerialStatus(connected) {
    serialConnected = connected;
}

/**
 * Register the simulate endpoint at runtime (called from index.js after
 * forwarder is ready, to avoid a circular require between server and forwarder).
 * @param {Function} handleEvent - forwarder.handleEvent
 */
function registerSimulateEndpoint(handleEvent) {
    /**
     * POST /simulate/deposit
     * Body (optional): { weight: 18.4 }
     * Triggers the exact same pipeline as a real Arduino deposit.
     * Useful for end-to-end testing without hardware.
     */
    app.post('/simulate/deposit', async (req, res) => {
        const weight = req.body?.weight != null ? parseFloat(req.body.weight) : null;

        console.log(`[bridge] ▶ Simulate deposit triggered (weight: ${weight ?? 'none'})`);

        try {
            const result = await handleEvent({ event: 'deposit', weight });
            res.json({ success: true, result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
}

module.exports = { startServer, getActiveSession, setSerialStatus, registerSimulateEndpoint };
