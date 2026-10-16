#!/usr/bin/env bash
# ==============================================================================
# CraftifAI PipeGen v0.5.1 - Stage 4 & 5 Execution Script
# OmniRetail AI: Edge Store Sentinel & Queue Autopilot
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================================="
echo "    🚀 Launching OmniRetail AI (CraftifAI PipeGen Track A) "
echo "=========================================================="

echo "[1/4] Checking Hardware Acceleration (NVIDIA GPU / Jetson)..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
    HAVE_CUDA=1
else
    echo "[NOTICE] Running in Edge Simulator / Apple Silicon mode. Deploying via Optimized Neural Engine & Synthetic TensorRT Stream."
    HAVE_CUDA=0
fi

echo "[2/4] Verifying TensorRT Engine & Profiling..."
python3 "$SCRIPT_DIR/build_tensorrt_engine.py"

echo "[3/4] Initializing Virtual ESP32 Hardware Bridge & MQTT Broker..."
python3 "$PROJECT_ROOT/engine/virtual_esp32_bridge.py" --daemon &
BRIDGE_PID=$!

echo "[4/4] Starting OmniRetail Perception & Analytics Engine + Web Cockpit..."
python3 "$PROJECT_ROOT/server.py"

trap "kill $BRIDGE_PID 2>/dev/null || true" EXIT
