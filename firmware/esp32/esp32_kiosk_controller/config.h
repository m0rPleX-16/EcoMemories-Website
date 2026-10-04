#ifndef CONFIG_H
#define CONFIG_H

// ==============================================================================
//  EcoMemories ESP32 Firmware Configuration
// ==============================================================================

// --- 0. Hardware Feature Flags ---
// 1 = Hardware module connected, 0 = Disabled (uses virtual/simulated fallback)
#define ENABLE_WEIGHT_SENSOR   0    // 0 = Disabled (no load cell; deposit counts by sensor alone)
#define ENABLE_THERMAL_PRINTER 0    // 0 = Disabled (no thermal printer; receipt outputs to Serial Monitor & screen)

// --- 1. Wi-Fi Configuration ---
#define WIFI_SSID             "Andrade-ZTE"
#define WIFI_PASSWORD         "22UcQ3zR"
#define WIFI_CONNECT_TIMEOUT  15000 // Milliseconds before retrying

// --- 2. Laravel Backend API Configuration ---
// Set this to your laptop/server's local network IP (192.168.1.2)
#define LARAVEL_EVENT_URL     "http://192.168.1.2:8000/api/devices/events"
#define DEVICE_ID             "ESP32-001"
#define DEVICE_SECRET         ""    // Leave empty if DEVICE_SECRET is not enforced in .env

// --- 3. Local Kiosk Server Configuration ---
// Runs on the ESP32 so the React photobooth kiosk can register sessions (/session)
// and command thermal printing (/print) directly without needing a separate Node bridge.
#define LOCAL_SERVER_PORT     3333

// --- 4. Hardware Pin Mapping (ESP32 DevKit V1) ---
// Proximity / Object Detection (IR obstacle sensor or HC-SR04 ultrasonic)
#define SENSOR_MODE_IR        0     // Set to 1 for IR sensor, 0 for HC-SR04 ultrasonic
#define PROXIMITY_PIN         14    // IR sensor digital OUT (or HC-SR04 TRIG)
#define ULTRASONIC_ECHO_PIN   27    // Only used if SENSOR_MODE_IR is 0

// Weight Sensor (HX711 Load Cell Amplifier)
#define HX711_DOUT_PIN        18
#define HX711_SCK_PIN         19
#define HX711_CALIBRATION     -7050.0f // Adjust with calibration weights
#define MIN_WEIGHT_GRAMS      5.0f     // Ignore vibrations < 5g
#define MAX_WEIGHT_GRAMS      200.0f   // Filter out heavy anomalies / liquids

// Thermal Printer (HardwareSerial UART 2)
#define PRINTER_RX_PIN        16    // ESP32 RX2 connects to Printer TX
#define PRINTER_TX_PIN        17    // ESP32 TX2 connects to Printer RX
#define PRINTER_BAUD_RATE     9600  // Common speeds: 9600 or 19200

// Feedback & Indicators
#define BUZZER_PIN            25    // Active buzzer (HIGH = sound)
#define STATUS_LED_PIN        2     // Onboard LED (indicates Wi-Fi & deposit status)

// --- 5. Timing & Debounce ---
#define DEPOSIT_DEBOUNCE_MS   1000  // Snappy 1-second delay between deposits (prevents double counts)
#define ULTRASONIC_MAX_DIST_CM 45.0f // Detection range in cm (2cm to 45cm)

#endif // CONFIG_H
