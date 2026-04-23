#!/bin/bash

# Stop all BrightSky local services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═════════════════════════════════════════════════"
echo "  Stopping BrightSky Local Services"
echo "═════════════════════════════════════════════════"
echo ""

# Stop Rust Solver
if [ -f "logs/rust-solver.pid" ]; then
    PID=$(cat logs/rust-solver.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Rust Solver (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Rust Solver stopped"
    else
        echo -e "${YELLOW}WARN:${NC} Rust Solver was not running"
    fi
    rm -f logs/rust-solver.pid
else
    echo -e "${YELLOW}WARN:${NC} No PID file found for Rust Solver"
    # Try to find and kill by process name
    pkill -f "brightsky" 2>/dev/null && echo -e "${GREEN}✓${NC} Killed brightsky process" || true
fi

# Stop API Server
if [ -f "logs/api-server.pid" ]; then
    PID=$(cat logs/api-server.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping API Server (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        echo -e "${GREEN}✓${NC} API Server stopped"
    else
        echo -e "${YELLOW}WARN:${NC} API Server was not running"
    fi
    rm -f logs/api-server.pid
else
    echo -e "${YELLOW}WARN:${NC} No PID file found for API Server"
    pkill -f "node.*api-server" 2>/dev/null && echo -e "${GREEN}✓${NC} Killed API server process" || true
fi

# Stop UI
if [ -f "logs/ui.pid" ]; then
    PID=$(cat logs/ui.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping UI (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        echo -e "${GREEN}✓${NC} UI stopped"
    else
        echo -e "${YELLOW}WARN:${NC} UI was not running"
    fi
    rm -f logs/ui.pid
else
    echo -e "${YELLOW}WARN:${NC} No PID file found for UI"
    pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✓${NC} Killed Vite process" || true
fi

# Also kill any remaining node processes related to our project
pkill -f "tsx.*api-server" 2>/dev/null || true
pkill -f "esbuild.*api" 2>/dev/null || true

echo ""
echo -e "${GREEN}All services stopped.${NC}"
echo ""
echo "To restart, run: ./scripts/local-deploy.sh"
