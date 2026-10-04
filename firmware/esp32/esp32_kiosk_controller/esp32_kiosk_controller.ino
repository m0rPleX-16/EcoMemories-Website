/**
 * EcoMemories — ESP32 Smart Kiosk & Deposit Controller
 *
 * Capabilities:
 *  1. Direct Wi-Fi HTTP Client: Sends deposit events to Laravel (/api/devices/events).
 *  2. Onboard WebServer (Port 3333): Implements the EcoMemories bridge protocol
 *     (/status, /session, /print, /simulate/deposit) with full CORS support.
 *  3. Sensor Management: Proximity / Ultrasonic trigger + HX711 load cell weight reading.
 *  4. ESC/POS Thermal Receipt Printing: Generates formatted tickets with native 2D QR codes.
 *  5. Audio-Visual Feedback: Active buzzer tones for accepted items and earned credits.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>
#include <mbedtls/base64.h>
#include "config.h"

#if ENABLE_WEIGHT_SENSOR
#include "HX711.h"
#endif

// Compatibility between ArduinoJson v6 and v7
#if defined(ARDUINOJSON_VERSION_MAJOR) && ARDUINOJSON_VERSION_MAJOR >= 7
    #define JSON_DOC(name, size) JsonDocument name
#else
    #define JSON_DOC(name, size) StaticJsonDocument<size> name
#endif

// ─── Peripheral Instances ─────────────────────────────────────────────────────

WebServer server(LOCAL_SERVER_PORT);

#if ENABLE_THERMAL_PRINTER
#define printerSerial Serial2 // Use built-in ESP32 HardwareSerial 2
#endif

#if ENABLE_WEIGHT_SENSOR
HX711 scale;
bool hx711Ready = false;
#endif

// ─── State Management ────────────────────────────────────────────────────────

String activeSessionCode = "";
bool hasActiveSession = false;
unsigned long lastDepositTime = 0;
unsigned long lastSensorCheckTime = 0;
int sessionDepositCount = 0;
float lastMeasuredWeight = 0.0f;
String currentEventUrl = LARAVEL_EVENT_URL;

// ─── Audio & Feedback Functions ───────────────────────────────────────────────

void beepShort() {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
}

void beepRewardUnlocked() {
    // 3 cheerful ascending beeps
    for (int i = 0; i < 3; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        digitalWrite(STATUS_LED_PIN, HIGH);
        delay(120);
        digitalWrite(BUZZER_PIN, LOW);
        digitalWrite(STATUS_LED_PIN, LOW);
        delay(80);
    }
}

void beepError() {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(400);
    digitalWrite(BUZZER_PIN, LOW);
}

// ─── ESC/POS Thermal Printer Commands ─────────────────────────────────────────

#if ENABLE_THERMAL_PRINTER
void printerInit() {
    printerSerial.write(0x1B); // ESC @ (Initialize printer)
    printerSerial.write(0x40);
    delay(50);
}

void printerSetAlign(uint8_t align) {
    // 0 = Left, 1 = Center, 2 = Right
    printerSerial.write(0x1B);
    printerSerial.write(0x61);
    printerSerial.write(align);
}

void printerSetBold(bool bold) {
    printerSerial.write(0x1B);
    printerSerial.write(0x45);
    printerSerial.write(bold ? 0x01 : 0x00);
}

void printerSetDoubleSize(bool enable) {
    printerSerial.write(0x1D);
    printerSerial.write(0x21);
    printerSerial.write(enable ? 0x11 : 0x00);
}

void printerFeed(uint8_t lines = 2) {
    printerSerial.write(0x1B);
    printerSerial.write(0x64);
    printerSerial.write(lines);
}

void printerCut() {
    // Standard ESC/POS partial cut
    printerSerial.write(0x1D);
    printerSerial.write(0x56);
    printerSerial.write(0x42);
    printerSerial.write(0x00);
}

/**
 * Print 2D QR Code using standard ESC/POS GS ( k command
 */
void printerPrintQRCode(const String& qrData) {
    int len = qrData.length() + 3;
    uint8_t pL = len % 256;
    uint8_t pH = len / 256;

    // 1. Model select (Model 2)
    uint8_t modelCmd[] = {0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00};
    printerSerial.write(modelCmd, sizeof(modelCmd));

    // 2. Module size (Scale 6)
    uint8_t sizeCmd[] = {0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06};
    printerSerial.write(sizeCmd, sizeof(sizeCmd));

    // 3. Error correction level (Level M = 49)
    uint8_t errCmd[] = {0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31};
    printerSerial.write(errCmd, sizeof(errCmd));

    // 4. Store data
    printerSerial.write(0x1D);
    printerSerial.write(0x28);
    printerSerial.write(0x6B);
    printerSerial.write(pL);
    printerSerial.write(pH);
    printerSerial.write(0x31);
    printerSerial.write(0x50);
    printerSerial.write(0x30);
    printerSerial.print(qrData);

    // 5. Print the QR code
    uint8_t printCmd[] = {0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30};
    printerSerial.write(printCmd, sizeof(printCmd));
    delay(100);
}
#endif

/**
 * Formats and prints the complete EcoMemories souvenir receipt ticket
 */
void printEcoReceipt(String refCode, String photoUrl, String sessionCode, int itemsRecycled) {
    Serial.println("\n╔════════════════════════════════════════════════════╗");
    Serial.println("║            ECOMEMORIES RECEIPT TICKET              ║");
    Serial.println("╠════════════════════════════════════════════════════╣");
    Serial.printf ("║ Reference:       %-34s║\n", refCode.c_str());
    Serial.printf ("║ Session:         %-34s║\n", sessionCode.c_str());
    Serial.printf ("║ Items Recycled:  %-34d║\n", itemsRecycled);
    Serial.println("║ Reward Earned:   1 Photo Credit                    ║");
    Serial.println("║ Format:          4-Pose Souvenir Strip             ║");
    Serial.println("╟────────────────────────────────────────────────────╢");
    Serial.printf ("║ Photo URL: %-40s║\n", photoUrl.c_str());
    Serial.println("║ Scan the QR code on the kiosk screen to download!  ║");
    Serial.println("╚════════════════════════════════════════════════════╝\n");

#if ENABLE_THERMAL_PRINTER
    printerInit();

    // Header
    printerSetAlign(1); // Center
    printerSetDoubleSize(true);
    printerSetBold(true);
    printerSerial.println("ECOMEMORIES");
    printerSetDoubleSize(false);
    printerSerial.println("RECYCLING REWARD RECEIPT");
    printerSetBold(false);
    printerSerial.println("================================");

    // Body
    printerSetAlign(0); // Left
    printerSerial.printf("Items Recycled:  %d items\n", itemsRecycled);
    printerSerial.println("Reward Earned:   1 Photo Credit");
    printerSerial.println("Format:          4-Pose Souvenir Strip");
    if (sessionCode.length() > 0) {
        printerSerial.printf("Session:         %s\n", sessionCode.c_str());
    }
    printerSetBold(true);
    printerSerial.printf("Reference:       %s\n", refCode.c_str());
    printerSetBold(false);
    printerSerial.println("--------------------------------");

    // QR Code
    printerSetAlign(1); // Center
    printerSerial.println("Scan below to download your");
    printerSerial.println("digital photostrip souvenir:");
    printerFeed(1);

    printerPrintQRCode(photoUrl);

    printerFeed(1);
    printerSetBold(true);
    printerSerial.println(photoUrl);
    printerSetBold(false);
    printerSerial.println("================================");
    printerSerial.println("Thank you for helping");
    printerSerial.println("reduce waste!");
    printerFeed(3);
    printerCut();
#endif
}

// ─── Laravel API Communication ────────────────────────────────────────────────

/**
 * Sends a structured deposit event to Laravel POST /api/devices/events
 */
bool sendDepositToLaravel(String sessionCode, float weight) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[API] ✗ Wi-Fi not connected. Cannot forward deposit.");
        beepError();
        return false;
    }

    HTTPClient http;
    http.begin(currentEventUrl);
    http.addHeader("Content-Type", "application/json");

    if (strlen(DEVICE_SECRET) > 0) {
        http.addHeader("X-Device-Secret", DEVICE_SECRET);
    }

    // Generate unique event ID
    String eventId = "evt_" + String((uint32_t)ESP.getEfuseMac(), HEX) + "_" + String(millis());

    JSON_DOC(doc, 256);
    doc["device_id"] = DEVICE_ID;
    doc["event"] = "deposit";
    doc["event_id"] = eventId;
    doc["session_code"] = sessionCode;
    if (weight > 0.0f) {
        doc["weight"] = round(weight * 10.0f) / 10.0f;
    }

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.printf("[API] ▶ Sending deposit to Laravel (%s)...\n", currentEventUrl.c_str());
    Serial.println("[API] Payload: " + requestBody);

    int httpCode = http.POST(requestBody);
    bool success = false;

    if (httpCode == 200 || httpCode == 201) {
        String response = http.getString();
        Serial.printf("[API] ✓ Success (%d): %s\n", httpCode, response.c_str());

        JSON_DOC(respDoc, 512);
        DeserializationError err = deserializeJson(respDoc, response);
        if (!err) {
            bool rewardEarned = respDoc["reward_earned"] | false;
            int deposits = respDoc["session"]["deposits"] | (sessionDepositCount + 1);
            sessionDepositCount = deposits;

            if (rewardEarned) {
                Serial.println("[API] ★ REWARD EARNED! Session photo credit unlocked.");
                beepRewardUnlocked();
            } else {
                beepShort();
            }
        } else {
            beepShort();
        }
        success = true;
    } else {
        String errorMsg = http.getString();
        Serial.printf("[API] ✗ Error (%d): %s\n", httpCode, errorMsg.c_str());
        beepError();
    }

    http.end();
    return success;
}

// ─── Local WebServer Routes (Bridge Emulation for React Kiosk) ────────────────

void handleCors() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
}

void handleOptions() {
    handleCors();
    server.send(204);
}

void handleStatus() {
    handleCors();
    JSON_DOC(doc, 256);
    doc["device_id"] = DEVICE_ID;
    doc["status"] = "online";
    doc["active"] = hasActiveSession;
    if (hasActiveSession) {
        doc["session_code"] = activeSessionCode;
    } else {
        doc["session_code"] = "";
    }
    doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
    doc["ip"] = WiFi.localIP().toString();
    doc["deposits_this_session"] = sessionDepositCount;
    doc["last_weight"] = lastMeasuredWeight;
    doc["uptime_ms"] = millis();

    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

void handlePostSession() {
    handleCors();
    if (!server.hasArg("plain")) {
        server.send(400, "application/json", "{\"error\":\"Missing body\"}");
        return;
    }

    JSON_DOC(doc, 128);
    DeserializationError err = deserializeJson(doc, server.arg("plain"));
    if (err || !doc.containsKey("session_code")) {
        server.send(422, "application/json", "{\"error\":\"session_code is required\"}");
        return;
    }

    activeSessionCode = doc["session_code"].as<String>();
    activeSessionCode.trim();
    activeSessionCode.toUpperCase();
    hasActiveSession = (activeSessionCode.length() > 0);
    sessionDepositCount = 0;

    if (doc.containsKey("event_url")) {
        currentEventUrl = doc["event_url"].as<String>();
        Serial.println("[BRIDGE] Updated dynamic Laravel Event URL: " + currentEventUrl);
    }

    Serial.println("[BRIDGE] ✓ Active session registered: " + activeSessionCode);
    beepShort();

    JSON_DOC(resp, 128);
    resp["success"] = true;
    resp["session_code"] = activeSessionCode;

    String response;
    serializeJson(resp, response);
    server.send(200, "application/json", response);
}

void handleDeleteSession() {
    handleCors();
    activeSessionCode = "";
    hasActiveSession = false;
    sessionDepositCount = 0;
    Serial.println("[BRIDGE] Session cleared");

    server.send(200, "application/json", "{\"success\":true}");
}

void handlePrint() {
    handleCors();
    if (!server.hasArg("plain")) {
        server.send(400, "application/json", "{\"error\":\"Missing body\"}");
        return;
    }

    JSON_DOC(doc, 512);
    DeserializationError err = deserializeJson(doc, server.arg("plain"));
    if (err) {
        server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
    }

    String refCode = doc["reference_code"].as<String>();
    if (refCode.length() == 0) refCode = "ECO-00000";

    String photoUrl = doc["photo_url"].as<String>();
    if (photoUrl.length() == 0) photoUrl = "https://ecomemories.local/photo/" + refCode;

    String sessionCode = doc["session_code"].as<String>();
    if (sessionCode.length() == 0) sessionCode = activeSessionCode;

    int itemsRecycled = doc["items_recycled"] | 5;

    printEcoReceipt(refCode, photoUrl, sessionCode, itemsRecycled);

    server.send(200, "application/json", "{\"success\":true,\"printed\":true}");
}

/**
 * Streams raw ESC/POS dithered photostrip raster bitmap chunks from the tablet
 */
void handlePrintChunk() {
    handleCors();
    if (!server.hasArg("plain")) {
        server.send(400, "application/json", "{\"error\":\"Missing body\"}");
        return;
    }

    JSON_DOC(doc, 4096);
    DeserializationError err = deserializeJson(doc, server.arg("plain"));
    if (err) {
        server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
    }

    const char* b64Data = doc["data"] | "";
    bool isFirst = doc["is_first"] | false;
    bool isLast = doc["is_last"] | false;
    size_t b64Len = strlen(b64Data);

#if ENABLE_THERMAL_PRINTER
    if (isFirst) {
        printerInit();
        printerSetAlign(1); // Center
        Serial.println("[PRINTER] ▶ Starting photostrip image print stream...");
    }

    if (b64Len > 0) {
        size_t maxRawLen = (b64Len * 3) / 4 + 4;
        uint8_t rawBuf[2048];
        if (maxRawLen <= sizeof(rawBuf)) {
            size_t outLen = 0;
            int ret = mbedtls_base64_decode(rawBuf, sizeof(rawBuf), &outLen, (const unsigned char*)b64Data, b64Len);
            if (ret == 0 && outLen > 0) {
                printerSerial.write(rawBuf, outLen);
            }
        }
    }

    if (isLast) {
        printerFeed(3);
        printerCut();
        Serial.println("[PRINTER] ✓ Photostrip printed and fed successfully.");
    }
#else
    if (isFirst) {
        Serial.println("[PRINTER-SIM] ▶ Starting simulated photostrip print stream...");
    }
    Serial.printf("[PRINTER-SIM] Received raster chunk (%d b64 chars)\n", (int)b64Len);
    if (isLast) {
        Serial.println("[PRINTER-SIM] ✓ Photostrip finished (Paper fed & cut).");
    }
#endif

    server.send(200, "application/json", "{\"success\":true}");
}

void handleSimulateDeposit() {
    handleCors();
    float weight = 18.5f;
    if (server.hasArg("plain")) {
        JSON_DOC(doc, 128);
        if (!deserializeJson(doc, server.arg("plain")) && doc.containsKey("weight")) {
            weight = doc["weight"].as<float>();
        }
    }

    if (!hasActiveSession) {
        server.send(400, "application/json", "{\"error\":\"No active session registered on ESP32\"}");
        return;
    }

    bool success = sendDepositToLaravel(activeSessionCode, weight);
    server.send(success ? 200 : 500, "application/json", success ? "{\"success\":true}" : "{\"error\":\"Failed\"}");
}

void handleSensorDebug() {
    handleCors();
    JSON_DOC(doc, 256);
#if SENSOR_MODE_IR
    doc["mode"] = "IR";
    doc["raw_pin"] = digitalRead(PROXIMITY_PIN);
    doc["detected"] = (digitalRead(PROXIMITY_PIN) == LOW);
#else
    doc["mode"] = "ULTRASONIC";
    digitalWrite(PROXIMITY_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(PROXIMITY_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(PROXIMITY_PIN, LOW);
    long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000);
    float dist = (duration == 0) ? -1.0f : (duration * 0.034f / 2.0f);
    doc["duration_us"] = duration;
    doc["distance_cm"] = dist;
    doc["detected"] = (dist > 2.0f && dist < 30.0f);
#endif
    String resp;
    serializeJson(doc, resp);
    server.send(200, "application/json", resp);
}

// ─── Sensor Polling ───────────────────────────────────────────────────────────

bool isObjectDetected() {
#if SENSOR_MODE_IR
    // IR Obstacle Sensor typically outputs LOW when an obstacle is close
    return digitalRead(PROXIMITY_PIN) == LOW;
#else
    // HC-SR04 Ultrasonic Trigger
    digitalWrite(PROXIMITY_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(PROXIMITY_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(PROXIMITY_PIN, LOW);

    long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000);
    if (duration == 0) return false;
    float distanceCm = duration * 0.034f / 2.0f;
    if (distanceCm > 2.0f && distanceCm < 30.0f) {
        Serial.printf("[ULTRASONIC] Object detected at %.1f cm (duration: %ld us)\n", distanceCm, duration);
        return true;
    }
    return false;
#endif
}

float readWeightGrams() {
#if ENABLE_WEIGHT_SENSOR
    if (!hx711Ready) return 18.0f; // Return simulated weight if HX711 is not connected

    if (scale.is_ready()) {
        float rawWeight = scale.get_units(5); // Average 5 readings
        if (rawWeight < 0) rawWeight = 0;
        return rawWeight;
    }
    return 0.0f;
#else
    return 18.0f; // Simulated average recyclable bottle/can weight
#endif
}

void checkDepositSensors() {
    unsigned long now = millis();
    if (now - lastDepositTime < DEPOSIT_DEBOUNCE_MS) {
        return; // Debounce period
    }

    if (isObjectDetected()) {
        digitalWrite(STATUS_LED_PIN, HIGH);
        delay(150); // Allow item to settle onto weight platform

        float weight = readWeightGrams();
        lastMeasuredWeight = weight;
        lastDepositTime = millis();

        Serial.printf("[SENSOR] Object detected! Measured weight: %.1fg\n", weight);

#if ENABLE_WEIGHT_SENSOR
        // Filter invalid weight or spurious vibration
        if (weight > 0.0f && (weight < MIN_WEIGHT_GRAMS || weight > MAX_WEIGHT_GRAMS)) {
            Serial.printf("[SENSOR] Weight %.1fg outside threshold (%0.1f - %0.1fg). Ignored.\n",
                          weight, MIN_WEIGHT_GRAMS, MAX_WEIGHT_GRAMS);
            beepError();
            digitalWrite(STATUS_LED_PIN, LOW);
            return;
        }
#endif

        if (hasActiveSession) {
            Serial.printf("[DEPOSIT] Valid deposit! Forwarding to session: %s\n", activeSessionCode.c_str());
            sendDepositToLaravel(activeSessionCode, weight);
        } else {
            Serial.println("[DEPOSIT] Item detected, but no active kiosk session registered.");
            beepShort();
        }

        digitalWrite(STATUS_LED_PIN, LOW);
    }
}

// ─── Setup & Loop ─────────────────────────────────────────────────────────────

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n╔═════════════════════════════════════════════╗");
    Serial.println("║   EcoMemories ESP32 Smart Kiosk Firmware    ║");
    Serial.println("╚═════════════════════════════════════════════╝");

    // Pin Modes
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(STATUS_LED_PIN, LOW);

#if SENSOR_MODE_IR
    pinMode(PROXIMITY_PIN, INPUT_PULLUP);
#else
    pinMode(PROXIMITY_PIN, OUTPUT);
    pinMode(ULTRASONIC_ECHO_PIN, INPUT);
#endif

    // Thermal Printer UART Setup
#if ENABLE_THERMAL_PRINTER
    printerSerial.begin(PRINTER_BAUD_RATE, SERIAL_8N1, PRINTER_RX_PIN, PRINTER_TX_PIN);
    Serial.println("[INIT] Printer Serial (UART2) initialized.");
#else
    Serial.println("[INIT] Thermal Printer disabled (digital receipts on screen & Serial).");
#endif

    // HX711 Load Cell Setup
#if ENABLE_WEIGHT_SENSOR
    scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
    if (scale.wait_ready_timeout(1000)) {
        scale.set_scale(HX711_CALIBRATION);
        scale.tare(); // Zero the scale
        hx711Ready = true;
        Serial.println("[INIT] HX711 Load Cell calibrated and tared.");
    } else {
        Serial.println("[INIT] ! HX711 not detected. Weight fallback mode active.");
    }
#else
    Serial.println("[INIT] Weight sensor disabled (single sensor item counting mode).");
#endif

    // Connect to Wi-Fi
    Serial.printf("[WIFI] Connecting to SSID: %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long wifiStart = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - wifiStart < WIFI_CONNECT_TIMEOUT)) {
        delay(500);
        Serial.print(".");
        digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    }
    digitalWrite(STATUS_LED_PIN, LOW);

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WIFI] ✓ Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());
        beepShort();
    } else {
        Serial.println("\n[WIFI] ! Failed to connect to Wi-Fi. Retrying in background...");
    }

    // Setup Local WebServer Routes
    server.on("/status", HTTP_GET, handleStatus);
    server.on("/session", HTTP_POST, handlePostSession);
    server.on("/session", HTTP_DELETE, handleDeleteSession);
    server.on("/print", HTTP_POST, handlePrint);
    server.on("/print-chunk", HTTP_POST, handlePrintChunk);
    server.on("/simulate/deposit", HTTP_POST, handleSimulateDeposit);
    server.on("/sensor", HTTP_GET, handleSensorDebug);

    // Options for CORS Preflight
    server.on("/status", HTTP_OPTIONS, handleOptions);
    server.on("/session", HTTP_OPTIONS, handleOptions);
    server.on("/print", HTTP_OPTIONS, handleOptions);
    server.on("/print-chunk", HTTP_OPTIONS, handleOptions);
    server.on("/simulate/deposit", HTTP_OPTIONS, handleOptions);
    server.on("/sensor", HTTP_OPTIONS, handleOptions);

    server.begin();
    Serial.printf("[SERVER] ✓ Local Kiosk Server listening on http://%s:%d\n",
                  WiFi.localIP().toString().c_str(), LOCAL_SERVER_PORT);
}

void loop() {
    // 1. Maintain Wi-Fi Connection
    if (WiFi.status() != WL_CONNECTED) {
        static unsigned long lastReconnectAttempt = 0;
        if (millis() - lastReconnectAttempt > 10000) {
            lastReconnectAttempt = millis();
            Serial.println("[WIFI] Attempting Wi-Fi reconnection...");
            WiFi.reconnect();
        }
    }

    // 2. Handle incoming HTTP requests from the React Kiosk
    server.handleClient();

    // 3. Poll physical sensors for deposits
    if (millis() - lastSensorCheckTime > 100) {
        lastSensorCheckTime = millis();
        checkDepositSensors();
    }
}
