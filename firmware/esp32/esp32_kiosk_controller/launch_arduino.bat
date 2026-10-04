@echo off
title Launch Arduino IDE (EcoMemories ESP32)
setlocal

set TEMP=C:\Temp
set TMP=C:\Temp
if not exist "C:\Temp" mkdir "C:\Temp"
if not exist "C:\esp32_kiosk_controller" mkdir "C:\esp32_kiosk_controller"

:: Synchronize project files to clean build folder
copy /Y "%~dp0config.h" "C:\esp32_kiosk_controller\config.h" >nul 2>&1
copy /Y "%~dp0esp32_kiosk_controller.ino" "C:\esp32_kiosk_controller\esp32_kiosk_controller.ino" >nul 2>&1

:: Kill any hung/orphaned IDE or compiler processes
taskkill /F /IM "Arduino IDE.exe" >nul 2>&1
taskkill /F /IM arduino-cli.exe >nul 2>&1
taskkill /F /IM cc1plus.exe >nul 2>&1
taskkill /F /IM xtensa-esp32-elf-g++.exe >nul 2>&1
taskkill /F /IM xtensa-esp-elf-g++.exe >nul 2>&1

echo ===============================================================
echo   Starting Arduino IDE with Clean Temp Directory (C:\Temp)...
echo ===============================================================

start "" "C:\Program Files\Arduino IDE\Arduino IDE.exe" "C:\esp32_kiosk_controller\esp32_kiosk_controller.ino"
