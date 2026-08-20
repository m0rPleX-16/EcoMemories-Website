# EcoMemories Bridge

A Node.js serial bridge that connects an Arduino (via USB) to the EcoMemories Laravel backend.

## What it does

```
Arduino (USB Serial)
       │
       │  DEPOSIT\n  or  DEPOSIT:18.4\n
       ▼
  Node Bridge  ◄──── POST /session (from React kiosk)
       │
       │  POST /api/devices/events
       ▼
  Laravel API
```

When the React kiosk starts a session, it tells the bridge which session is active.
When Arduino sends a `DEPOSIT` line over serial, the bridge forwards a structured
deposit event to Laravel — exactly as a real ESP32 device would do over Wi-Fi.

---

## Requirements

- Node.js 18 or later
- Arduino connected via USB
- Laravel running locally or via Cloudflare Tunnel

---

## Setup

```bash
cd bridge
cp .env.example .env
# Edit .env — set SERIAL_PORT, LARAVEL_URL, DEVICE_ID, etc.
npm install
```

---

## Running

```bash
npm start
```

Or with auto-restart on file changes (Node 18+):

```bash
npm run dev
```

Startup output looks like:

```
╔══════════════════════════════════════╗
║       EcoMemories Bridge v1.0        ║
╚══════════════════════════════════════╝
  Bridge port  : 3333
  Laravel URL  : http://localhost:8000
  Device ID    : ARDUINO-001
  Serial port  : COM3 @ 9600 baud
  Auth secret  : ✓ configured
────────────────────────────────────────
✓ HTTP server running on port 3333
⏳ Opening serial port COM3...
✓ Serial port COM3 open
```

---

## HTTP Endpoints

| Method   | Path                | Description                                      |
|----------|---------------------|--------------------------------------------------|
| `GET`    | `/status`           | Bridge health + serial status + active session   |
| `POST`   | `/session`          | Register active session `{ session_code }`       |
| `DELETE` | `/session`          | Clear active session                             |
| `POST`   | `/simulate/deposit` | Trigger a fake deposit (optional `{ weight }`)   |

### GET /status — example response

```json
{
  "active": true,
  "session_code": "ABC123",
  "device_id": "ARDUINO-001",
  "serial_connected": true,
  "uptime_seconds": 142
}
```

### POST /simulate/deposit — test without hardware

```bash
curl -X POST http://localhost:3333/simulate/deposit \
  -H "Content-Type: application/json" \
  -d '{"weight": 18.4}'
```

---

## Arduino Serial Protocol

The bridge understands these lines from the Arduino:

| Line sent            | Meaning                        |
|----------------------|--------------------------------|
| `DEPOSIT\n`          | Valid deposit, no weight data  |
| `DEPOSIT:18.4\n`     | Valid deposit, 18.4g weight    |
| `PING\n`             | Heartbeat — logged, not forwarded |
| anything else        | Logged as unknown, ignored     |

### Minimal Arduino sketch

```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  // Replace this with your actual sensor logic.
  // For testing: send DEPOSIT every 10 seconds.
  Serial.println("DEPOSIT");
  delay(10000);
}
```

### With weight sensor

```cpp
// After reading weight from HX711:
Serial.print("DEPOSIT:");
Serial.println(weightGrams, 1); // e.g. "DEPOSIT:18.4"
```

---

## Environment Variables

| Variable        | Default               | Description                              |
|-----------------|-----------------------|------------------------------------------|
| `SERIAL_PORT`   | `COM3`                | USB serial port                          |
| `BAUD_RATE`     | `9600`                | Must match `Serial.begin()` in sketch    |
| `LARAVEL_URL`   | `http://localhost:8000` | Laravel base URL                       |
| `DEVICE_ID`     | `ARDUINO-001`         | Device code in Laravel devices table     |
| `DEVICE_SECRET` | _(empty)_             | Optional shared secret for auth header   |
| `BRIDGE_PORT`   | `3333`                | Local HTTP server port                   |

---

## Stage E — ESP32 Migration

When you move to ESP32, this bridge is no longer needed. The ESP32 connects
to Wi-Fi and calls `POST /api/devices/events` on Laravel directly. The device
event API contract stays exactly the same.
