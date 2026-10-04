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

:: Kill any orphaned compiler processes from previous runs
taskkill /F /IM cc1plus.exe >nul 2>&1
taskkill /F /IM xtensa-esp32-elf-g++.exe >nul 2>&1
taskkill /F /IM xtensa-esp-elf-g++.exe >nul 2>&1

echo =======================================================
echo   EcoMemories ESP32 - Compile and Flash (COM3)
echo =======================================================
echo.

set ARDUINO_CLI="C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe"

%ARDUINO_CLI% compile --upload -p COM3 --fqbn esp32:esp32:esp32:UploadSpeed=115200 --build-path "C:\Temp\build" "C:\esp32_kiosk_controller"

if %ERRORLEVEL% equ 0 (
    echo.
    echo =======================================================
    echo   [SUCCESS] ESP32 flashed and running!
    echo =======================================================
) else (
    echo.
    echo [ERROR] Flash failed. If the board showed "Connecting...",
    echo press and hold the BOOT button on the ESP32 and retry.
)
echo.
pause
