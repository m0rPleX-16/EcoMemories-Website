'use strict';

require('dotenv').config();

const { startServer, setSerialStatus, registerSimulateEndpoint } = require('./server');
const { startSerialListener } = require('./serial');
const { handleEvent } = require('./forwarder');

// ─── Config ───────────────────────────────────────────────────────────────────

const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || '3333', 10);
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE   = parseInt(process.env.BAUD_RATE || '9600', 10);
const LARAVEL_URL = process.env.LARAVEL_URL || 'http://localhost:8000';
const DEVICE_ID   = process.env.DEVICE_ID   || 'ARDUINO-001';
const HAS_SECRET  = Boolean(process.env.DEVICE_SECRET);

// ─── Banner ───────────────────────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════╗');
console.log('║       EcoMemories Bridge v1.0        ║');
console.log('╚══════════════════════════════════════╝');
console.log(`  Bridge port  : ${BRIDGE_PORT}`);
console.log(`  Laravel URL  : ${LARAVEL_URL}`);
console.log(`  Device ID    : ${DEVICE_ID}`);
console.log(`  Serial port  : ${SERIAL_PORT} @ ${BAUD_RATE} baud`);
console.log(`  Auth secret  : ${HAS_SECRET ? '✓ configured' : '✗ not set (open mode)'}`);
console.log('────────────────────────────────────────');
console.log('');

// ─── Start HTTP Server ────────────────────────────────────────────────────────

const server = startServer(BRIDGE_PORT);

// ─── Register Simulate Endpoint (Task 6) ─────────────────────────────────────
// Wired after forwarder is loaded to avoid circular require between
// server.js and forwarder.js.

registerSimulateEndpoint(handleEvent);

// ─── Start Serial Listener ────────────────────────────────────────────────────

startSerialListener({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE,
    onEvent: (parsedEvent) => {
        // Fire-and-forget — errors are logged inside handleEvent.
        handleEvent(parsedEvent).catch(() => {});
    },
    onStatusChange: setSerialStatus,
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(signal) {
    console.log(`\n[bridge] ${signal} received — shutting down cleanly...`);

    server.close(() => {
        console.log('[bridge] HTTP server closed.');
        process.exit(0);
    });

    // Force-exit if server.close() hangs (e.g. open keep-alive connections).
    setTimeout(() => {
        console.warn('[bridge] Forced exit after timeout.');
        process.exit(1);
    }, 5000).unref();
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
