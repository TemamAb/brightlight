#!/bin/bash

# BrightSky Profit Monitor
# Continuously monitors profit generation and system health

API_PORT=3000
RUST_PORT=4001
INTERVAL=10  # Check every 10 seconds

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "═════════════════════════════════════════════════"
echo "     BrightSky Profit Monitor"
echo "══════════════════════════════════════════════════"
echo ""

while true; do
    clear
    echo "═════════════════════════════════════════════════"
    echo "  BrightSky Live Monitor - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "══════════════════════════════════════════════════"
    echo ""
    
    # Check API Health
    echo -e "${BLUE}API Server (port $API_PORT):${NC}"
    HEALTH=$(curl -s http://localhost:$API_PORT/api/health 2>/dev/null)
    if echo "$HEALTH" | grep -q "ok"; then
        echo -e "  ${GREEN}✓${NC} Healthy"
    else
        echo -e "  ${RED}✗${NC} Not responding"
    fi
    
    # Check Rust Solver
    echo ""
    echo -e "${BLUE}Rust Solver (port $RUST_PORT):${NC}"
    SOLVER_HEALTH=$(curl -s http://localhost:$RUST_PORT/health 2>/dev/null)
    if echo "$SOLVER_HEALTH" | grep -q "ok"; then
        echo -e "  ${GREEN}✓${NC} Healthy"
    else
        echo -e "  ${YELLOW}?${NC} Not responding (may be expected if not started)"
    fi
    
    # Get Profit Stats
    echo ""
    echo -e "${BLUE}Profit Generation:${NC}"
    STATS=$(curl -s http://localhost:$API_PORT/api/stats 2>/dev/null)
    if [ -n "$STATS" ]; then
        echo "$STATS" | jq -r '. | "  Total Profit: \(.total_profit) ETH\n  Trades: \(.trades_count)\n  Success Rate: \(.success_rate)%"' 2>/dev/null || echo "  $STATS" | head -5
    else
        echo -e "  ${YELLOW}Stats endpoint not available${NC}"
    fi
    
    # Check recent trades
    echo ""
    echo -e "${BLUE}Recent Trades:${NC}"
    TRADES=$(curl -s http://localhost:$API_PORT/api/trades?limit=3 2>/dev/null)
    if [ -n "$TRADES" ]; then
        echo "$TRADES" | jq -r '.[] | "  \(.timestamp) | \(.profit_eth) ETH | \(.status)"' 2>/dev/null || echo "  Unable to parse trades"
    else
        echo -e "  ${YELLOW}No recent trades${NC}"
    fi
    
    # Check logs for errors (last 5 lines)
    echo ""
    echo -e "${BLUE}Recent Errors (last 5):${NC}"
    if [ -f "logs/api-server.log" ]; then
        ERRORS=$(tail -100 logs/api-server.log | grep -i "error\|failed\|exception" | tail -5)
        if [ -n "$ERRORS" ]; then
            echo "$ERRORS" | while read line; do
                echo -e "  ${RED}✗${NC} $line"
            done
        else
            echo -e "  ${GREEN}✓${NC} No recent errors"
        fi
    else
        echo "  Log file not found"
    fi
    
    echo ""
    echo "───────────────────────────────────────────────────"
    echo "Press Ctrl+C to exit. Next check in $INTERVAL seconds..."
    echo ""
    
    sleep $INTERVAL
done
