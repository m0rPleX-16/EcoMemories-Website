#!/bin/bash
set -e

# 1. Bind Apache to Render's dynamic $PORT and pass environment variables to mod_php
PORT="${PORT:-80}"
echo "[STARTUP] Configuring Apache to listen on port ${PORT}..."
echo "ServerName localhost" >> /etc/apache2/apache2.conf
echo "PassEnv APP_NAME APP_ENV APP_KEY APP_DEBUG APP_URL LOG_CHANNEL DB_CONNECTION DATABASE_URL DB_URL SESSION_DRIVER CACHE_STORE PORT" >> /etc/apache2/apache2.conf
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf

# 2. Ensure APP_KEY exists
if [ -z "$APP_KEY" ]; then
    echo "[STARTUP] No APP_KEY detected, generating a new application key..."
    php artisan key:generate --force
fi

# 3. Export container environment variables to .env so Dotenv always has access in Apache workers
echo "[STARTUP] Writing runtime environment variables..."
printenv | grep -E '^(APP_|DB_|DATABASE_|SESSION_|CACHE_|LOG_|PORT|VITE_)' > /var/www/html/.env || true

# 4. Create public storage symlink for uploaded photobooth photos
echo "[STARTUP] Linking storage..."
php artisan storage:link --force || true

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

# 6. Cache configuration, routes, and views for optimal performance & stability
echo "[STARTUP] Caching configuration, routes, and views..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# 7. CRUCIAL: Re-assign all storage, cache, and .env permissions to www-data
echo "[STARTUP] Setting file permissions for www-data..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/.env
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
chmod 664 /var/www/html/.env || true

# 8. Start Apache web server in foreground
echo "[STARTUP] Starting Apache web server..."
exec apache2-foreground
