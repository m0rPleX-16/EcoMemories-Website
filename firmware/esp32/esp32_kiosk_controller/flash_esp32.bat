@echo off
title Upload EcoMemories ESP32 Firmware
setlocal

set TEMP=C:\Temp
set TMP=C:\Temp
if not exist "C:\Temp" mkdir "C:\Temp"
if not exist "C:\esp32_kiosk_controller" mkdir "C:\esp32_kiosk_controller"

:: Synchronize project files to clean build folder
copy /Y "%~dp0config.h" "C:\esp32_kiosk_controller\config.h" >nul 2>&1
copy /Y "%~dp0esp32_kiosk_controller.ino" "C:\esp32_kiosk_controller\esp32_kiosk_controller.ino" >nul 2>&1

:: Free COM port by killing Serial Monitor and hung compiler processes
taskkill /F /IM serial-monitor.exe >nul 2>&1
taskkill /F /IM cc1plus.exe >nul 2>&1
taskkill /F /IM xtensa-esp32-elf-g++.exe >nul 2>&1
taskkill /F /IM xtensa-esp-elf-g++.exe >nul 2>&1

set TARGET_PORT=%1
if "%TARGET_PORT%"=="" set TARGET_PORT=COM3

echo =======================================================
echo   EcoMemories ESP32 - Compile and Flash (%TARGET_PORT%)
echo =======================================================
echo.

set ARDUINO_CLI="C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe"

if not exist %ARDUINO_CLI% (
    echo [ERROR] Arduino CLI was not found at:
    echo %ARDUINO_CLI%
    echo Please make sure Arduino IDE 2.x is installed in C:\Program Files\Arduino IDE.
    echo.
    pause
    exit /b 1
)

%ARDUINO_CLI% compile --upload -p %TARGET_PORT% --fqbn esp32:esp32:esp32:UploadSpeed=115200 --build-path "C:\Temp\build" "C:\esp32_kiosk_controller"

if %ERRORLEVEL% equ 0 (
    echo.
    echo =======================================================
    echo   [SUCCESS] ESP32 flashed and running!
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo   [ERROR] Flash failed on %TARGET_PORT%.
    echo.
    echo   Common causes:
    echo   1. Port in use: Close Arduino IDE Serial Monitor or serial terminals.
    echo   2. Bootloader sync: If it showed "Connecting...", press and HOLD
    echo      the 'BOOT' button on the ESP32 until the upload starts.
    echo   3. Wrong COM port: Check Device Manager for your ESP32 COM port.
    echo      You can pass the port directly: flash_esp32.bat COM4
    echo =======================================================
)
echo.
pause
