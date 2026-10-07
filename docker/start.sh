#!/bin/bash
set -e

# 1. Bind Apache to Render's dynamic $PORT (Render sets PORT=10000 by default)
PORT="${PORT:-80}"
echo "[STARTUP] Configuring Apache to listen on port ${PORT}..."
echo "ServerName localhost" >> /etc/apache2/apache2.conf
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

# 4. Clear any stale caches so live Render environment variables take effect
echo "[STARTUP] Refreshing configuration and route caches..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# 5. Wait for PostgreSQL and run database migrations
echo "[STARTUP] Connecting to database and running migrations..."
MAX_TRIES=15
COUNT=0
MIGRATED=0

while [ $COUNT -lt $MAX_TRIES ]; do
    if php artisan migrate --force; then
        echo "[STARTUP] ✓ Database migrations completed successfully."
        echo "[STARTUP] Seeding default ESP32 device..."
        php artisan db:seed --class=Esp32DeviceSeeder --force || true
        MIGRATED=1
        break
    fi
    COUNT=$((COUNT+1))
    echo "[STARTUP] Database not ready yet. Retrying in 2s ($COUNT/$MAX_TRIES)..."
    sleep 2
done

if [ $MIGRATED -eq 0 ]; then
    echo "[WARNING] Could not complete migrations after $MAX_TRIES attempts. Check database credentials."
fi

# 6. CRUCIAL: Re-assign all storage & cache permissions to www-data so Apache can read/write
echo "[STARTUP] Setting file permissions for www-data..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 7. Start Apache web server in foreground
echo "[STARTUP] Starting Apache web server..."
exec apache2-foreground
