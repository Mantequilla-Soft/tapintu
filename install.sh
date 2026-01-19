#!/bin/bash

# Tapintu Installation Script
# This script installs Tapintu as a systemd service

set -e

echo "🐦 Installing Tapintu..."

# Get the current directory
TAPINTU_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$TAPINTU_DIR/tapintu.service"
SYSTEMD_DIR="/etc/systemd/system"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Check if .env exists
if [ ! -f "$TAPINTU_DIR/.env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp "$TAPINTU_DIR/.env.example" "$TAPINTU_DIR/.env"
    echo "✅ Created .env file. Please edit it if needed."
fi

# Check if node_modules exists
if [ ! -d "$TAPINTU_DIR/node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    cd "$TAPINTU_DIR"
    npm install
fi

# Update service file with actual paths
echo "📝 Updating service file paths..."
CURRENT_USER=$(logname)
sed -i "s|User=meno|User=$CURRENT_USER|g" "$SERVICE_FILE"
sed -i "s|/home/meno/Documents/menosoft/tapintu|$TAPINTU_DIR|g" "$SERVICE_FILE"

# Copy service file to systemd directory
echo "📋 Copying service file to $SYSTEMD_DIR..."
cp "$SERVICE_FILE" "$SYSTEMD_DIR/tapintu.service"

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
echo "✅ Enabling Tapintu service..."
systemctl enable tapintu.service

# Start the service
echo "🚀 Starting Tapintu service..."
systemctl start tapintu.service

# Check status
echo ""
echo "✨ Installation complete!"
echo ""
echo "Service status:"
systemctl status tapintu.service --no-pager

echo ""
echo "📊 Useful commands:"
echo "  - Check status:  sudo systemctl status tapintu"
echo "  - Stop service:  sudo systemctl stop tapintu"
echo "  - Start service: sudo systemctl start tapintu"
echo "  - Restart:       sudo systemctl restart tapintu"
echo "  - View logs:     sudo journalctl -u tapintu -f"
echo "  - Disable:       sudo systemctl disable tapintu"
echo ""
echo "🌐 Access Tapintu at: http://localhost:3000"
