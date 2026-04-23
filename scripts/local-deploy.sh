#!/bin/bash
set -e

# BrightSky Local Deployment Strategy
# Runs all services on local ports for safe testing and profit monitoring

echo "═══════════════════════════════════════════════════"
echo "     BrightSky Local Deployment Strategy"
echo "═══════════════════════════════════════════════════"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Port Configuration
RUST_SOLVER_PORT=4001
API_PORT=3000
UI_PORT=5173
INTERNAL_BRIDGE_PORT=4001

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}ERR: .env file not found!${NC}"
    echo "Please create .env with production variables"
    exit 1
fi

# Export INTERNAL_BRIDGE_PORT for the API server
export INTERNAL_BRIDGE_PORT=$INTERNAL_BRIDGE_PORT

echo -e "${YELLOW}Step 1: Environment Check${NC}"
echo "───────────────────────────────────────────────────────"

# Source .env file
set -a
source .env
set +a

# Verify critical variables
REQUIRED_VARS=("DATABASE_URL" "RPC_ENDPOINT" "PRIVATE_KEY" "WALLET_ADDRESS" "PIMLICO_API_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}ERR: Missing critical variable: $var${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $var is set"
done

echo ""
echo -e "${YELLOW}Step 2: Database Connectivity${NC}"
echo "───────────────────────────────────────────────────────"
DB_HOST=$(echo $DATABASE_URL | sed -e 's|.*@||' -e 's|/.*||' -e 's|:.*||')
if command -v nc &> /dev/null; then
    if nc -z -w 5 "$DB_HOST" 5432 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Database reachable at $DB_HOST"
    else
        echo -e "${YELLOW}WARN:${NC} Database may not be reachable at $DB_HOST (nc check failed)"
    fi
else
    echo -e "${YELLOW}WARN:${NC} nc not installed, skipping database connectivity check"
fi

echo ""
echo -e "${YELLOW}Step 3: Rust Solver Compilation${NC}"
echo "───────────────────────────────────────────────────────"
if command -v cargo &> /dev/null; then
    echo "Compiling Rust solver in release mode..."
    cd solver && cargo build --release 2>&1 | tee /tmp/brightsky-cargo.log
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Rust solver compiled successfully"
    else
        echo -e "${RED}ERR: Compilation failed${NC}"
        tail -20 /tmp/brightsky-cargo.log
        exit 1
    fi
    cd ..
else
    echo -e "${YELLOW}WARN:${NC} cargo not found, skipping Rust compilation"
fi

echo ""
echo -e "${YELLOW}Step 4: Install Node Dependencies${NC}"
echo "───────────────────────────────────────────────────────"
pnpm install
echo -e "${GREEN}✓${NC} Dependencies installed"

echo ""
echo -e "${YELLOW}Step 5: Start Services${NC}"
echo "───────────────────────────────────────────────────────"

# Create logs directory
mkdir -p logs

# Function to check if port is in use
check_port() {
    if lsof -i:$1 &> /dev/null || netstat -an | grep ":$1 " &> /dev/null; then
        echo -e "${RED}ERR: Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Check ports
check_port $RUST_SOLVER_PORT || exit 1
check_port $API_PORT || exit 1
check_port $UI_PORT || exit 1

echo "Starting Rust Solver on port $RUST_SOLVER_PORT..."
if [ -f "solver/target/release/brightsky" ]; then
    export RUST_LOG=info
    nohup ./solver/target/release/brightsky > logs/rust-solver.log 2>&1 &
    RUST_PID=$!
    echo "  PID: $RUST_PID"
    echo $RUST_PID > logs/rust-solver.pid
else
    echo -e "${YELLOW}WARN:${NC} Rust binary not found, skipping solver start"
fi

echo ""
echo "Starting API Server on port $API_PORT..."
export PORT=$API_PORT
nohup pnpm --filter @workspace/api-server run start > logs/api-server.log 2>&1 &
API_PID=$!
echo "  PID: $API_PID"
echo $API_PID > logs/api-server.pid

sleep 2

echo ""
echo "Starting UI on port $UI_PORT..."
cd ui && nohup pnpm run dev -- --port $UI_PORT > ../logs/ui.log 2>&1 &
UI_PID=$!
cd ..
echo "  PID: $UI_PID"
echo $UI_PID > logs/ui.pid

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════"
echo "     All Services Started Successfully"
echo "═══════════════════════════════════════════════════${NC}"
echo ""
echo "Service URLs:"
echo "  - Rust Solver:    http://localhost:$RUST_SOLVER_PORT"
echo "  - API Server:     http://localhost:$API_PORT"
echo "  - UI Dashboard:   http://localhost:$UI_PORT"
echo ""
echo "Log files:"
echo "  - Rust Solver:    logs/rust-solver.log"
echo "  - API Server:     logs/api-server.log"
echo "  - UI:             logs/ui.log"
echo ""
echo "To monitor profit, run: ./scripts/monitor-profit.sh"
echo "To stop all services, run: ./scripts/stop-local.sh"
echo ""
echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for services to be ready
sleep 5

# Check health endpoints
echo ""
echo "Health Checks:"
if curl -s http://localhost:$API_PORT/api/health | grep -q "ok"; then
    echo -e "${GREEN}✓${NC} API Server is healthy"
else
    echo -e "${YELLOW}WARN:${NC} API Server health check failed"
fi

if curl -s http://localhost:$RUST_SOLVER_PORT/health | grep -q "ok"; then
    echo -e "${GREEN}✓${NC} Rust Solver is healthy"
else
    echo -e "${YELLOW}WARN:${NC} Rust Solver health check failed"
fi

echo ""
echo -e "${GREEN}Deployment complete. Monitoring profit generation...${NC}"
