#!/bin/bash
set -e

# 1. Bind Apache to Render's dynamic $PORT (Render sets PORT=10000 by default)
PORT="${PORT:-80}"
echo "[STARTUP] Configuring Apache to listen on port ${PORT}..."
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf

# 2. Ensure APP_KEY exists
if [ -z "$APP_KEY" ]; then
    echo "[STARTUP] No APP_KEY detected, generating a new application key..."
    php artisan key:generate --force
fi

# 3. Create public storage symlink for uploaded photobooth photos
echo "[STARTUP] Linking storage..."
php artisan storage:link --force || true

# 4. Run database migrations and seed essential devices (ESP32-001)
echo "[STARTUP] Running database migrations..."
if php artisan migrate --force; then
    echo "[STARTUP] Database migrations completed."
    echo "[STARTUP] Seeding default ESP32 device..."
    php artisan db:seed --class=Esp32DeviceSeeder --force || true
else
    echo "[WARNING] Migration failed. Check if PostgreSQL database credentials are correct."
fi

# 5. Clear and cache Laravel configuration, routes, and views for speed
echo "[STARTUP] Optimizing Laravel caches..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# 6. Start Apache foreground process
echo "[STARTUP] Starting Apache web server..."
exec apache2-foreground
