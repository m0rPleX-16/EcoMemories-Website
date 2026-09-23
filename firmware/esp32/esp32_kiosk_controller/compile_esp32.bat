@echo off
title Compile EcoMemories ESP32 Firmware
set TEMP=C:\Temp
set TMP=C:\Temp
if not exist "C:\Temp" mkdir "C:\Temp"

echo =======================================================
echo   Compiling EcoMemories ESP32 Firmware...
echo =======================================================
"C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe" compile --fqbn esp32:esp32:esp32 "C:\esp32_kiosk_controller"

if %ERRORLEVEL% equ 0 (
    echo.
    echo =======================================================
    echo   [SUCCESS] Compilation finished with 0 errors!
    echo =======================================================
) else (
    echo.
    echo [ERROR] Compilation failed.
)
pause
