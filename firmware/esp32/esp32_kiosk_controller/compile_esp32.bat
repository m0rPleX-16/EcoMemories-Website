@echo off
title Compile EcoMemories ESP32 Firmware
setlocal

set TEMP=C:\Temp
set TMP=C:\Temp
if not exist "C:\Temp" mkdir "C:\Temp"
if not exist "C:\esp32_kiosk_controller" mkdir "C:\esp32_kiosk_controller"

:: Synchronize project files to clean build folder
copy /Y "%~dp0config.h" "C:\esp32_kiosk_controller\config.h" >nul 2>&1
copy /Y "%~dp0esp32_kiosk_controller.ino" "C:\esp32_kiosk_controller\esp32_kiosk_controller.ino" >nul 2>&1

:: Kill any orphaned compiler processes from previous failed runs
taskkill /F /IM cc1plus.exe >nul 2>&1
taskkill /F /IM xtensa-esp32-elf-g++.exe >nul 2>&1
taskkill /F /IM xtensa-esp-elf-g++.exe >nul 2>&1

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
    echo [WARNING] Retrying with clean build cache...
    "C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe" compile --fqbn esp32:esp32:esp32 --clean "C:\esp32_kiosk_controller"
    if %ERRORLEVEL% equ 0 (
        echo.
        echo =======================================================
        echo   [SUCCESS] Clean compilation finished with 0 errors!
        echo =======================================================
    ) else (
        echo.
        echo [ERROR] Compilation failed.
    )
)

echo.
pause
