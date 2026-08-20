'use strict';

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// ─── Line Parser ──────────────────────────────────────────────────────────────

/**
 * Parse a raw line received from the Arduino into a structured event object.
 *
 * Supported formats:
 *   DEPOSIT         → { event: 'deposit', weight: null }
 *   DEPOSIT:18.4    → { event: 'deposit', weight: 18.4 }
 *   PING            → { event: 'ping', weight: null }
 *   <anything else> → null (unknown, ignored)
 *
 * @param {string} raw
 * @returns {{ event: string, weight: number|null }|null}
 */
function parseLine(raw) {
    const line = raw.trim().toUpperCase();

    if (line === 'PING') {
        return { event: 'ping', weight: null };
    }

    if (line === 'DEPOSIT') {
        return { event: 'deposit', weight: null };
    }

    // DEPOSIT:<weight> — e.g. "DEPOSIT:18.4"
    if (line.startsWith('DEPOSIT:')) {
        const weightStr = line.slice('DEPOSIT:'.length).trim();
        const weight = parseFloat(weightStr);

        if (!isNaN(weight) && weight >= 0) {
            return { event: 'deposit', weight };
        }

        // Weight present but unparseable — still treat as a deposit, log warning.
        console.warn(`[serial] ⚠ Could not parse weight from "${raw.trim()}" — forwarding as weightless deposit`);
        return { event: 'deposit', weight: null };
    }

    return null;
}

// ─── Serial Listener ─────────────────────────────────────────────────────────

/**
 * Open the serial port and start listening for Arduino lines.
 *
 * @param {object} options
 * @param {string}   options.path            - Serial port path (e.g. COM3, /dev/ttyUSB0)
 * @param {number}   options.baudRate        - Baud rate (must match Arduino sketch)
 * @param {Function} options.onEvent         - Callback invoked with parsed event objects
 * @param {Function} options.onStatusChange  - Callback invoked with boolean (connected/disconnected)
 */
function startSerialListener({ path, baudRate, onEvent, onStatusChange }) {
    let port;

    try {
        port = new SerialPort({ path, baudRate, autoOpen: false });
    } catch (err) {
        console.error(`[serial] ✗ Failed to create SerialPort instance: ${err.message}`);
        onStatusChange(false);
        return;
    }

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    // ── Port lifecycle events ───────────────────────────────────────────────

    port.on('open', () => {
        console.log(`[serial] ✓ Serial port ${path} open`);
        onStatusChange(true);
    });

    port.on('close', () => {
        console.warn(`[serial] ⚠ Serial port ${path} closed`);
        onStatusChange(false);
    });

    port.on('error', (err) => {
        console.error(`[serial] ✗ Serial port error: ${err.message}`);
        onStatusChange(false);
    });

    // ── Incoming data ───────────────────────────────────────────────────────

    parser.on('data', (rawLine) => {
        const trimmed = rawLine.trim();
        if (!trimmed) return;

        console.log(`[serial] ← "${trimmed}"`);

        const parsed = parseLine(trimmed);

        if (parsed === null) {
            console.warn(`[serial] ⚠ Unknown line ignored: "${trimmed}"`);
            return;
        }

        if (parsed.event === 'ping') {
            console.log('[serial] ♥ Heartbeat (PING) received');
            return;
        }

        // Forward to the event handler (forwarder.handleEvent)
        onEvent(parsed);
    });

    // ── Open the port ───────────────────────────────────────────────────────

    console.log(`[bridge] ⏳ Opening serial port ${path}...`);

    port.open((err) => {
        if (err) {
            console.error(`[serial] ✗ Could not open ${path}: ${err.message}`);
            console.warn('[serial]   Bridge HTTP server is still running.');
            console.warn('[serial]   Use POST /simulate/deposit to test without hardware.');
            onStatusChange(false);
        }
    });
}

module.exports = { startSerialListener, parseLine };
