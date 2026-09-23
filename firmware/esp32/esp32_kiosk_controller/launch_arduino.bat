@echo off
title Launch Arduino IDE (EcoMemories ESP32)
set TEMP=C:\Temp
set TMP=C:\Temp
if not exist "C:\Temp" mkdir "C:\Temp"

echo [EcoMemories] Starting Arduino IDE with clean temp directory (C:\Temp)...
start "" "C:\Program Files\Arduino IDE\Arduino IDE.exe" "C:\esp32_kiosk_controller\esp32_kiosk_controller.ino"
