#!/usr/bin/env bash
set -e

APP_DIR="$(pwd)"
echo "==> [NAAP] Starting production startup routine in $APP_DIR..."

# 1. Ensure storage and bootstrap cache directories and permissions
mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache || true

# 2. Check and configure environment file
if [ ! -f .env ] && [ -f .env.example ]; then
    echo "==> [NAAP] .env not found, creating from .env.example..."
    cp .env.example .env
    php artisan key:generate --force
fi

# 3. Create storage symlink
echo "==> [NAAP] Linking storage..."
php artisan storage:link --force || true

# 4. Run database migrations
echo "==> [NAAP] Running database migrations (php artisan migrate --force)..."
php artisan migrate --force

# 5. Cache configurations & routes for optimal production performance
echo "==> [NAAP] Optimizing caches..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# 6. Launch services (PHP-FPM, Background Face Engine, Nginx)
if command -v supervisord &> /dev/null; then
    echo "==> [NAAP] Starting background services via Supervisord..."
    exec supervisord -c supervisord.conf
else
    echo "==> [NAAP] Supervisord not found, starting services via background process manager..."
    
    # Graceful shutdown handler
    cleanup() {
        echo "==> [NAAP] Stopping background processes..."
        kill $(jobs -p) 2>/dev/null || true
        exit 0
    }
    trap cleanup SIGINT SIGTERM EXIT

    # Start PHP-FPM
    echo "==> [NAAP] Starting PHP-FPM..."
    php-fpm -F -y "$APP_DIR/php-fpm.conf" &

    # Start Python Face Engine
    echo "==> [NAAP] Starting Face Engine (FastAPI/Uvicorn)..."
    if [ -f "$APP_DIR/face_engine/venv/bin/uvicorn" ]; then
        "$APP_DIR/face_engine/venv/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 --app-dir "$APP_DIR/face_engine" &
    else
        python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir "$APP_DIR/face_engine" &
    fi

    # Start Nginx in foreground
    echo "==> [NAAP] Starting Nginx on 0.0.0.0:80..."
    nginx -c "$APP_DIR/nginx.conf"
fi
