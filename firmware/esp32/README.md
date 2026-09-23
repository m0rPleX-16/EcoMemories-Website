# EcoMemories — ESP32 Kiosk Firmware Guide

This directory contains the complete C++ firmware for the **ESP32 microcontroller**, connecting physical sensors, the ESC/POS thermal printer, Wi-Fi networking, and the EcoMemories Laravel API.

---

## 🏗 System Architecture

```
                      ┌───────────────────────────────────────┐
                      │        ESP32 Microcontroller          │
                      │                                       │
  [IR Sensor / HC-SR04] ─> (GPIO 14/27)                       │
  [HX711 Load Cell]    ─> (GPIO 18/19)                        │
  [Active Buzzer]      <─ (GPIO 25)                           │
  [Thermal Printer]    <─ (GPIO 17 TX2 / 16 RX2)              │
                      │                                       │
                      │  • Outbound: POST /api/devices/events ┼──> [Laravel Backend API]
                      │  • Inbound:  WebServer on :3333       │
                      │     (/status, /session, /print)       │
                      └───────────────────▲───────────────────┘
                                          │ Local HTTP (Wi-Fi)
                                          │
                               ┌──────────┴──────────┐
                               │  React Kiosk Screen │
                               │  (VITE_BRIDGE_URL)  │
                               └─────────────────────┘
```

When you use this ESP32 firmware, **the Node.js serial bridge (`bridge/`) is no longer required**. The ESP32 implements both the hardware sensor handling and the exact HTTP interface expected by the React frontend kiosk!

---

## 📌 Pinout & Wiring Diagram

### 1. ESP32 DevKit V1 (30-pin / 38-pin) Connections

| Component | Pin on Component | ESP32 Pin | Logic Level | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **IR Proximity Sensor** | `VCC` | `VIN` or `3V3` | 3.3V / 5V | Detects item drop |
| | `GND` | `GND` | Ground | |
| | `OUT` | **GPIO 14** | Active LOW | |
| **HX711 Load Cell** | `VCC` | `3V3` or `5V` | 3.3V – 5V | Measures weight |
| | `GND` | `GND` | Ground | |
| | `DT (Data)` | **GPIO 18** | Digital Input | |
| | `SCK (Clock)`| **GPIO 19** | Digital Output | |
| **Active Buzzer** | `+` (Positive) | **GPIO 25** | 3.3V | Audible feedback |
| | `-` (Ground) | `GND` | Ground | |
| **ESC/POS Thermal Printer** | `TX` | **GPIO 16 (RX2)** | 3.3V / 5V | Serial data from printer |
| | `RX` | **GPIO 17 (TX2)** | 3.3V / 5V | Serial commands to printer |
| | `GND` | `GND` | Ground | **Must share common ground** |
| | `POWER` (5V-9V) | External 5V/2A PSU | **External** | **Do not power printer from ESP32 3.3V** |

> [!IMPORTANT]
> **Power Notice**: Thermal printers draw high peak currents (up to 2A–2.5A during heavy dark printing and QR rendering). Always power the thermal printer with a dedicated **5V 2A–3A power adapter**, tying the printer ground and ESP32 ground together.

---

## 🛠 Arduino IDE Setup

### 1. Board Package
1. Open **Arduino IDE** -> **Settings / Preferences**.
2. Add the ESP32 board URL to **Additional Boards Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools** -> **Board** -> **Boards Manager**, search for `esp32` by Espressif Systems and click **Install**.
4. Select your board under **Tools** -> **Board** -> **ESP32 Arduino** -> `DOIT ESP32 DEVKIT V1` (or your specific ESP32 variant).

### 2. Required Libraries
Install the following via the Arduino IDE Library Manager (`Ctrl + Shift + I`):
1. **ArduinoJson** (by Benoit Blanchon) — Version 6.x or 7.x
2. **HX711 Arduino Library** (by Bogdan Necula) — for load cell weight reading

---

## ⚙️ Configuration (`config.h`)

Open `firmware/esp32/config.h` and update the parameters for your environment:

```cpp
// 1. Your Wi-Fi network credentials
#define WIFI_SSID             "Your_WiFi_Name"
#define WIFI_PASSWORD         "Your_WiFi_Password"

// 2. Laravel API URL (use your computer's IP or Cloudflare tunnel URL)
#define LARAVEL_EVENT_URL     "http://192.168.1.100:8000/api/devices/events"

// 3. Registered Device Code
#define DEVICE_ID             "ESP32-001"
#define DEVICE_SECRET         ""    // Fill if DEVICE_SECRET is set in Laravel .env
```

---

## 🚀 How to Run with the React Kiosk

1. **Flash the ESP32**: Upload the sketch using Arduino IDE at 115200 baud.
2. **Check Serial Monitor**: Note the IP address assigned to the ESP32, for example: `192.168.1.150`.
3. **Configure the Frontend**:
   In your root `.env` or frontend configuration:
   ```env
   VITE_BRIDGE_URL=http://192.168.1.150:3333
   ```
4. **Start Laravel and Vite**:
   ```bash
   php artisan serve --host=0.0.0.0
   npm run dev
   ```
5. When a user opens `http://<your-ip>:5173/session/ECO-XXXX`, the kiosk automatically calls `POST http://192.168.1.150:3333/session` to register the active session with the ESP32.
6. When an item is deposited, the ESP32 sends `POST /api/devices/events` to Laravel, Laravel evaluates the 5-item reward rule, and the kiosk screen updates in real time!
7. When the user finishes their photostrip, the kiosk can trigger `POST http://192.168.1.150:3333/print` to print the thermal ticket and QR code.
