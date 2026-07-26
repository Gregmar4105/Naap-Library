#!/usr/bin/env bash
# ==============================================================================
# NAAP Library - Linux Ubuntu Face Engine Setup & Systemd Installer
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Setting up Python Face Engine in: $PROJECT_DIR"

# 1. Check Python3 installation
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 is not installed."
    echo "Please run: sudo apt update && sudo apt install -y python3 python3-venv python3-pip"
    exit 1
fi

# 2. Create virtual environment if missing
if [ ! -d "$PROJECT_DIR/face_engine/venv" ]; then
    echo "==> Creating Python virtual environment at face_engine/venv..."
    python3 -m venv "$PROJECT_DIR/face_engine/venv"
fi

# 3. Install requirements
echo "==> Installing Python dependencies into venv..."
"$PROJECT_DIR/face_engine/venv/bin/pip" install --upgrade pip
"$PROJECT_DIR/face_engine/venv/bin/pip" install -r "$PROJECT_DIR/face_engine/requirements.txt"

echo "==> Face Engine virtual environment setup complete!"

# 4. Optional: Systemd installation hint
SERVICE_FILE="/etc/systemd/system/naap-face-engine.service"
if [ "$EUID" -eq 0 ]; then
    echo "==> Installing systemd service to $SERVICE_FILE..."
    
    # Generate service file with actual project directory
    cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=NAAP Library Face Recognition Python Service
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/face_engine/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir face_engine
Restart=always
RestartSec=5
Environment=PATH=$PROJECT_DIR/face_engine/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
EOF

    echo "==> Reloading systemd and enabling service..."
    systemctl daemon-reload
    systemctl enable naap-face-engine
    systemctl restart naap-face-engine
    echo "==> Service status:"
    systemctl status naap-face-engine --no-pager
else
    echo ""
    echo "------------------------------------------------------------------------"
    echo "To install as a systemd service (so it runs automatically in background):"
    echo "Run with sudo:"
    echo "  sudo bash $0"
    echo "------------------------------------------------------------------------"
fi
