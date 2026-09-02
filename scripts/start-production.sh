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

# 6. Launch all production services via Supervisord (PHP-FPM, Background Face Engine, Nginx)
echo "==> [NAAP] Starting background services via Supervisord..."
exec supervisord -c supervisord.conf
