# EcoMemories ESP32 Smart Kiosk & Photobooth — Complete Hardware Guide

Welcome to the definitive hardware construction, wiring, and integration guide for the **EcoMemories Smart Recycling Photobooth Kiosk**.

This guide covers everything required to take your physical components (**ESP32, HC-SR04 Ultrasonic Sensor, Piezo Buzzer, Breadboard, Jumper Wires, 58mm Thermal Printer, and Tablet Screen**) from unboxing to a fully functioning recycling photobooth cabinet.

---

## 1. System Architecture & Dataflow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ECOMEMORIES BOOTH CABINET                       │
│                                                                        │
│   ┌──────────────────────────┐                                         │
│   │       TABLET SCREEN      │ ◄─── (Touchscreen mounted on front)     │
│   │  • React Web Application │                                         │
│   │  • Camera Capture        │                                         │
│   └────────────┬─────────────┘                                         │
│                │                                                       │
│                │ Wi-Fi (Local Network / Hotspot)                       │
│                ▼                                                       │
│   ┌──────────────────────────┐         UART Serial (GPIO 17 TX)        │
│   │       ESP32 BOARD        ├─────────────────────────────┐           │
│   │  • Wi-Fi Server (:3333)  │                             │           │
│   │  • Chute Detection Logic │                             │           │
│   └─────┬──────────────┬─────┘                             ▼           │
│         │              │                      ┌──────────────────────┐ │
│         │ GPIO 14      │ GPIO 25              │   THERMAL PRINTER    │ │
│         │ (Trigger)    │ (Buzzer Tone)        │ (58mm ESC/POS Roll)  │ │
│         ▼              ▼                      │ Prints Souvenir Strip│ │
│   ┌───────────┐  ┌───────────┐                └──────────┬───────────┘ │
│   │ ULTRASONIC│  │   PIEZO   │                           │             │
│   │  SENSOR   │  │  BUZZER   │                           │             │
│   │ (HC-SR04) │  │  (Chirps) │                           │             │
│   └───────────┘  └───────────┘                           │             │
│                                                          │             │
│   ┌──────────────────────────────────────────────┐       │             │
│   │ External 5V-9V 2A DC Power Supply ───────────┴───────┘             │
│   │ (Shared Common Ground with ESP32)                                  │
│   └────────────────────────────────────────────────────────────────────┘
│                                                                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Wi-Fi (POST /api/devices/events)
                                    ▼
                     ┌──────────────────────────────┐
                     │     HOST COMPUTER / SERVER   │
                     │  • Laravel API & MySQL DB    │
                     │  • Photostrip Image Storage  │
                     └──────────────────────────────┘
```

---

## 2. Complete Bill of Materials (BOM)

| Component | Specification | Quantity | Role in System |
| :--- | :--- | :---: | :--- |
| **Microcontroller** | ESP32 DevKit V1 (30-pin or 38-pin, ESP-WROOM-32) | 1 | Processes sensor signals, controls buzzer, streams print jobs, and talks to Laravel |
| **Deposit Sensor** | HC-SR04 or HC-SR04P Ultrasonic Transducer | 1 | Detects transparent plastic bottles and metal cans sliding through the chute |
| **Audio Feedback** | Active Piezo Buzzer (5V, continuous tone) | 1 | Emits immediate feedback chirps on item deposit and 3-tone victory fanfare on 5th item |
| **Prototyping Board** | Solderless Breadboard (400 or 830 tie-points) | 1 | Houses the ESP32 and provides shared 5V and Ground power bus rails |
| **Wiring** | 20cm Jumper Wires (10 Male-to-Male, 10 Male-to-Female) | 20 | Connects sensor, buzzer, and printer to the breadboard rails and ESP32 pins |
| **Microcontroller Power** | USB-A to Micro-USB / USB-C Data Cable (minimum 1A rated) | 1 | Supplies stable 5V power to ESP32 and uploads firmware from computer |
| **Thermal Printer** | 58mm POS Printer (Goojprt PT-210, POS-5802DD, or CSN-A2 TTL) | 1 | Prints physical 4-pose Atkinson-dithered photostrip souvenirs with QR code |
| **Print Media** | 58mm Thermal Paper Rolls (or 58mm Adhesive Sticker Rolls) | 2–5 | Heat-sensitive paper (no ink or ribbon required) |
| **Kiosk Display** | Tablet (Android, iPad, or Windows 10/11) | 1 | Interactive kiosk UI, camera capture, session management, and results preview |
| **Printer Power** | 5V–9V 2A DC Power Adapter (if using TTL panel printer) | 1 | Dedicated power for thermal heating elements (built-in battery if using PT-210) |

---

## 3. Breadboard Power Rails & Wiring Architecture

> [!IMPORTANT]
> **Understanding the Breadboard Power Bus:**
> The ESP32 only has two accessible `GND` pins on a breadboard, but you have **three** components requiring ground (**HC-SR04, Buzzer, and Thermal Printer**). 
> **Always use the breadboard power rails:**
> 1. Run a jumper wire from the ESP32 **`GND`** pin to the **Blue/Negative Rail (`-`)**.
> 2. Run a jumper wire from the ESP32 **`VIN`** pin to the **Red/Positive Rail (`+`)**.
> 3. Connect all component `GND` and `VCC` wires into these shared rails!

```
      (+) Red Rail:   [ 5V VIN from ESP32 ] ──────────────► Supplies HC-SR04 VCC
      (-) Blue Rail:  [ GND from ESP32 ]    ──────────────► Shared GND for Sensor, Buzzer, & Printer
```

### Complete Physical Breadboard Wiring Diagram

```
                              ESP32 DevKit V1
                             ┌─────────────────┐
                             │     [ USB ]     │
                             │                 │
     [+] 5V Breadboard Rail ◄┤ VIN         3V3 ├
     [-] GND Breadboard Rail ◄┤ GND         GND ├
                             │ D13         D15 │
                             │ D12          D2 │ (Onboard Blue Status LED)
                             │ D14          D4 │
         HC-SR04 TRIG (Pin) ◄┤ GPIO 14     RX2 ├◄─── (GPIO 16) Printer TX (Optional)
         HC-SR04 ECHO (Pin) ◄┤ GPIO 27     TX2 ├────► (GPIO 17) Printer RX (Print Data)
                             │ D26        GPIO │
           Buzzer (+) (Pin) ◄┤ GPIO 25    D18  │
                             │ D33         D19 │
                             │ D32         D21 │
                             │ D35         D22 │
                             │ D34         D23 │
                             └─────────────────┘
```

---

## 4. Pin-by-Pin Connection Matrix

### Recommended Wire Color Conventions
* **Red:** 5V Power (`VIN`)
* **Black:** Ground (`GND`)
* **Yellow:** Trigger Signals (`TRIG` / `GPIO 14`)
* **Green:** Echo Signals (`ECHO` / `GPIO 27`)
* **Orange:** Audio Signal (`Buzzer +` / `GPIO 25`)
* **White / Blue:** Serial Data (`Printer RX` / `GPIO 17`)

---

### Table A: HC-SR04 Ultrasonic Sensor Connections
| Sensor Pin | Wire Type | ESP32 / Breadboard Destination | Description |
| :--- | :---: | :--- | :--- |
| **`VCC`** | Female-to-Male | **Red Rail (`+`)** or ESP32 **`VIN`** (5V) | 5V operational power for the acoustic transducer |
| **`GND`** | Female-to-Male | **Blue Rail (`-`)** or ESP32 **`GND`** | System ground return |
| **`TRIG`** | Female-to-Male | ESP32 **`GPIO 14`** (labeled `D14`) | Receives 10µs sound emission trigger from ESP32 |
| **`ECHO`** | Female-to-Male | ESP32 **`GPIO 27`** (labeled `D27`) | Returns high pulse duration proportional to distance |

> [!TIP]
> **Why Ultrasonic is Superior to Infrared for Recycling:**
> Transparent PET plastic bottles allow infrared light to pass straight through without reflecting back. The HC-SR04 emits 40,000 Hz ultrasound waves that bounce reliably off **every** material, including clear bottles, colored plastics, crushed cans, and cardboard!

---

### Table B: Active Piezo Buzzer Connections
| Buzzer Pin | Wire Type | ESP32 / Breadboard Destination | Description |
| :--- | :---: | :--- | :--- |
| **`Longer Leg (+)`** | Male-to-Male | ESP32 **`GPIO 25`** (labeled `D25`) | Controlled by ESP32 PWM / digital high tone |
| **`Shorter Leg (-)`** | Male-to-Male | **Blue Rail (`-`)** or ESP32 **`GND`** | Common system ground |

---

### Table C: Thermal Printer Options

#### Option 1: Portable Bluetooth POS Printer (e.g., Goojprt PT-210, POS-5802DD) — *Recommended*
* **Wiring to ESP32:** **None needed.**
* **Connection:** Pairs wirelessly via Bluetooth directly to the **Tablet**.
* **Power:** Built-in rechargeable lithium-ion battery (charges via standard USB).
* **Setup on Tablet:**
  1. Turn on printer and enable Bluetooth on the tablet.
  2. Pair with the printer (PIN is usually `0000` or `1234`).
  3. On Android tablets, install **RawBT Print Service** or **ESC POS Print Service** from Google Play.
  4. The EcoMemories web app calls `window.print()`, sending the 58mm dithered strip straight to paper.

#### Option 2: Embedded Panel-Mount TTL Printer (e.g., CSN-A2, QR77)
| Printer Pin | Wire Type | Destination | Critical Instruction |
| :--- | :---: | :--- | :--- |
| **`RX` (Receive)** | Female-to-Male | ESP32 **`GPIO 17`** (`TX2`) | Receives ESC/POS raster print bytes |
| **`TX` (Transmit)** | Female-to-Male | ESP32 **`GPIO 16`** (`RX2`) | Optional status/paper-out signals |
| **`GND`** | Female-to-Male | **Blue Rail (`-`)** & Power Supply **`GND`** | **Must share common ground with ESP32** |
| **`VCC (5V–9V)`** | Power Cable | **External 5V–9V 2A DC Supply** | **NEVER connect to ESP32 pins!** |

> [!CAUTION]
> **Thermal Printer Power Warning:**
> When printing photographs with thousands of heated black dots, thermal printheads draw **1.5A to 2.5A peak current**. 
> Attempting to power a thermal printer from the ESP32's 5V/VIN pin will cause an instant brownout reboot (`Brownout detector was triggered`). Always use a separate 5V–9V 2A DC power adapter for panel printers.

---

## 5. Physical Chute Fabrication & Angle Geometry

To guarantee 100% detection rate when users drop items into the recycling chute, follow these construction recommendations:

```
               BOTTLE INSERTION OPENING
                      ┌─────────┐
                      │  ( 🍾 ) │
                      │         │
    Sensor Mount ──► 📡  \       \  Chute walls: Smooth plastic, wood, or acrylic
    (Angled at 35°)       \       \
                           \       \  Slide slope: 35° to 45°
                            \       \ (Ensures bottle slides past sensor in ~250ms)
                             \       \
                              └─────────► TO COLLECTION RECEPTACLE
```

1. **Slide Angle (Slope):** Set the chute floor at a **35° to 45° angle**. This allows gravity to slide the bottle down smoothly without tumbling too fast for the ultrasonic ping.
2. **Sensor Mounting Distance:** Mount the HC-SR04 transducer **5 cm to 10 cm above the sliding floor**.
3. **Internal Chute Width:** Make the chute 12 cm to 15 cm wide. This fits 330ml soda cans up to 1.5L plastic bottles while preventing items from twisting sideways.
4. **Debounce Logic:** The firmware has a built-in `DEPOSIT_DEBOUNCE_MS 2000` (2 seconds). Once a bottle is detected, additional vibrations or rolling are ignored for 2 seconds to prevent double-counting.

---

## 6. Firmware Configuration Guide (`config.h`)

All project configurations are centralized in [`firmware/esp32/esp32_kiosk_controller/config.h`](file:///c:/xampp/htdocs/EcoMemories-Website/firmware/esp32/esp32_kiosk_controller/config.h). Open this file in your editor or Arduino IDE and update the following settings:

### Step 1: Set Sensor Mode to Ultrasonic
```c
// Line 33:
#define SENSOR_MODE_IR        0     // 0 = HC-SR04 Ultrasonic (1 = IR Obstacle)
#define PROXIMITY_PIN         14    // Connects to HC-SR04 TRIG pin
#define ULTRASONIC_ECHO_PIN   27    // Connects to HC-SR04 ECHO pin
```

### Step 2: Configure Wi-Fi Credentials
```c
// Line 14-15:
#define WIFI_SSID             "EcoMemories-Booth"   // 2.4GHz Wi-Fi or Phone Hotspot
#define WIFI_PASSWORD         "your_password_here"
```

> [!NOTE]
> The ESP32 only supports **2.4 GHz Wi-Fi**. If using a dual-band home router or mobile hotspot, make sure the 2.4 GHz band is enabled.

### Step 3: Configure Backend API Endpoint
```c
// Line 22-23:
// Set this to your laptop/server's local network IP (e.g., 192.168.1.100)
#define LARAVEL_EVENT_URL     "http://192.168.1.100:8000/api/devices/events"
#define DEVICE_ID             "ESP32-001"
#define DEVICE_SECRET         ""    // Leave empty if not enforced in .env
```

---

## 7. Step-by-Step Code Upload Guide

### Upload Method 1: Using Arduino IDE
1. Run [`launch_arduino.bat`](file:///c:/xampp/htdocs/EcoMemories-Website/firmware/esp32/esp32_kiosk_controller/launch_arduino.bat) to launch the IDE with proper clean temporary directories.
2. Connect your ESP32 to the PC using your data cable.
3. In Arduino IDE:
   * **Tools $\rightarrow$ Board $\rightarrow$ esp32 $\rightarrow$ ESP32 Dev Module**
   * **Tools $\rightarrow$ Port $\rightarrow$ Select your COM port** (e.g., `COM3`, `COM4`, `COM7`)
   * **Tools $\rightarrow$ Upload Speed $\rightarrow$ 921600** (or `115200`)
4. Click the **Upload** button ($\rightarrow$).

> [!TIP]
> **If the IDE console hangs on `Connecting........_____.....`:**
> Press and hold the physical **`BOOT`** button on your ESP32 board for 2 seconds until the writing progress percentage begins (`Writing at 0x00010000... (10%)`), then release the button.

---

### Upload Method 2: One-Click Command Line Verification
You can compile and verify the entire firmware suite at any time from PowerShell:
```powershell
cmd /c "c:\xampp\htdocs\EcoMemories-Website\firmware\esp32\esp32_kiosk_controller\compile_esp32.bat"
```

---

## 8. Verification & Live Testing Checklist

Follow these 4 phases to verify every component step by step:

```text
┌─────────────────────────┐
│        PHASE 1          │
│ Serial Monitor & Wi-Fi  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│        PHASE 2          │
│ Sensor Wave & Buzzer    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│        PHASE 3          │
│ Tablet Polling & Fanfare│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│        PHASE 4          │
│ Capture & Thermal Print │
└─────────────────────────┘
```

### Phase 1: Serial Monitor & Network Link
1. In Arduino IDE, open **Tools $\rightarrow$ Serial Monitor** and set baud rate to **115200**.
2. Press the `EN` (Reset) button on the ESP32.
3. Confirm output matches:
   ```text
   ╔═════════════════════════════════════════════╗
   ║   EcoMemories ESP32 Smart Kiosk Firmware    ║
   ╚═════════════════════════════════════════════╝
   [INIT] Thermal Printer disabled (digital receipts on screen & Serial).
   [INIT] Weight sensor disabled (single sensor item counting mode).
   [WIFI] Connecting to SSID: EcoMemories-Booth...
   [WIFI] ✓ Connected! IP Address: 192.168.1.120
   [SERVER] ✓ Local Kiosk Server listening on http://192.168.1.120:3333
   ```
4. Note the printed IP address (e.g. `192.168.1.120`).

---

### Phase 2: Ultrasonic Detection & Audio Feedback
1. Hold a plastic bottle or your hand **8 cm** in front of the HC-SR04 transducers.
2. The buzzer will emit a crisp 100ms tone.
3. The Serial Monitor will output:
   ```text
   [SENSOR] Object detected! Measured weight: 18.0g
   ```
4. Verify the 2-second debounce: keeping your hand there does not trigger repeat deposits.

---

### Phase 3: Tablet Live Polling & Fanfare
1. On your tablet, navigate to `http://<your-laptop-ip>:8000`.
2. Tap **"Start Recycling Session"**.
3. Deposit 5 recyclable bottles or cans:
   * **Deposits 1 to 4:** The buzzer beeps once; the on-screen progress ring advances from `1/5` to `4/5` automatically every 2 seconds without refreshing.
   * **Deposit 5:** The buzzer plays a **3-tone victory fanfare**, confetti bursts on the tablet screen, and the camera unlocks!

---

### Phase 4: Souvenir Printing
1. Complete the 4 photo poses on the tablet.
2. On the **Results Page**:
   * Toggle **"Thermal Print (58mm)"** to inspect the clean white-paper Atkinson dithered portrait with high-contrast facial features.
   * Tap **"Print Photostrip Souvenir"**.
   * The tablet streams the dithered raster bit image directly to the thermal printer, outputting the physical souvenir strip!

---

## 9. Comprehensive Troubleshooting Matrix

| Symptom | Probable Cause | Exact Solution |
| :--- | :--- | :--- |
| **`Connecting........_____` during upload** | ESP32 bootloader pin held high by serial chip | Hold down the physical `BOOT` button on the ESP32 until the upload starts. |
| **Buzzer does not make sound** | Polarity reversed or wrong pin | Check that the longer leg `(+)` is in `GPIO 25` and the shorter leg `(-)` is in the ground rail. |
| **Ultrasonic sensor triggers continuously** | False echoes bouncing off inner chute walls | Angle the HC-SR04 downward into the chute at 35°. Ensure `TRIG` is in `GPIO 14` and `ECHO` is in `GPIO 27`. |
| **Printer outputs blank white paper** | Thermal paper roll inserted backwards | Thermal paper is heat-sensitive on only one side. Open the lid, turn the roll upside down, and close. |
| **ESP32 reboots when print starts** | Brownout caused by inadequate power | Do not power printer from ESP32. Use an external 5V–9V 2A power supply with shared ground. |
| **Tablet says "Bridge Disconnected"** | Tablet and ESP32 are on different subnets | Ensure both the tablet and ESP32 are connected to the exact same Wi-Fi router or mobile hotspot. |
| **Printed picture looks too dark/muddy** | Old Floyd-Steinberg algorithm applied | The firmware and web app are now updated with Atkinson dithering and portrait gamma correction ($\gamma = 0.68$). Ensure your browser cache is refreshed. |
