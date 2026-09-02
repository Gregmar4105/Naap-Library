#!/usr/bin/env bash
set -e

APP_DIR="$(pwd)"
echo "==> [NAAP] Starting production startup routine in $APP_DIR..."

# 1. Export library paths for C/C++ extensions (NumPy, libstdc++.so.6)
for libpath in /nix/store/*stdenv*/lib /nix/store/*gcc*/lib /root/.nix-profile/lib /usr/lib /usr/lib/x86_64-linux-gnu; do
    if [ -d "$libpath" ]; then
        export LD_LIBRARY_PATH="$libpath:$LD_LIBRARY_PATH"
    fi
done

# 2. Ensure storage, log, and Nginx temporary directories exist
mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache
mkdir -p /var/log/nginx /etc/nginx /tmp/nginx_client_body /tmp/nginx_proxy /tmp/nginx_fastcgi /tmp/nginx_uwsgi /tmp/nginx_scgi
chmod -R 777 storage bootstrap/cache /tmp/nginx_* /var/log/nginx 2>/dev/null || true

# 3. Check and configure environment file
if [ ! -f .env ] && [ -f .env.example ]; then
    echo "==> [NAAP] .env not found, creating from .env.example..."
    cp .env.example .env
    php artisan key:generate --force || true
fi

# 4. Create storage symlink
echo "==> [NAAP] Linking storage..."
php artisan storage:link --force || true

# 5. Run database migrations with retry (waits if DB container is still booting)
echo "==> [NAAP] Checking database and running migrations..."
for i in {1..5}; do
    if php artisan migrate --force; then
        echo "==> [NAAP] Migrations executed successfully."
        break
    else
        echo "==> [NAAP] Migration attempt $i failed (database might still be initializing), waiting 3s..."
        sleep 3
    fi
done

# 6. Optimize Laravel caches
echo "==> [NAAP] Optimizing Laravel caches..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# 7. Start services via Supervisord or fallback background manager
if command -v supervisord &> /dev/null; then
    echo "==> [NAAP] Starting all background services via Supervisord..."
    exec supervisord -c "$APP_DIR/supervisord.conf"
else
    echo "==> [NAAP] Supervisord not found, starting services via background process manager..."
    cleanup() {
        echo "==> [NAAP] Stopping background processes..."
        kill $(jobs -p) 2>/dev/null || true
        exit 0
    }
    trap cleanup SIGINT SIGTERM EXIT

    echo "==> [NAAP] Starting PHP-FPM..."
    php-fpm -F -R -y "$APP_DIR/php-fpm.conf" &

    echo "==> [NAAP] Starting Face Engine on internal port 8001..."
    if [ -f "$APP_DIR/face_engine/venv/bin/python" ]; then
        "$APP_DIR/face_engine/venv/bin/python" -m uvicorn main:app --host 127.0.0.1 --port 8001 --app-dir "$APP_DIR/face_engine" &
    else
        python3 -m uvicorn main:app --host 127.0.0.1 --port 8001 --app-dir "$APP_DIR/face_engine" &
    fi

    echo "==> [NAAP] Starting Nginx in foreground..."
    nginx -c "$APP_DIR/nginx.conf"
fi
