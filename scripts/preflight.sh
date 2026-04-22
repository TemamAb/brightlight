#!/bin/bash
set -e

echo "─── [BSS-38] PRE-FLIGHT INTEGRITY CHECK ───"

# 0. BSS-39: Compilation Integrity Check (BEFORE anything else)
# This specialist ensures the code compiles BEFORE deployment
if [[ "$*" != *"migrate"* ]]; then
    echo "─── [BSS-39] COMPILATION GUARD ───"
    if command -v cargo &> /dev/null; then
        echo "Running cargo build --release..."
        if cargo build --release --bin brightsky 2>&1 | tee /tmp/cargo-output.log; then
            echo "✓ [BSS-39] Rust Code Compiles Successfully"
        else
            echo "ERR: [BSS-39] COMPILATION FAILED"
            echo "Last 20 lines of compilation errors:"
            tail -20 /tmp/cargo-output.log
            exit 1
        fi
    else
        echo "WARN: cargo not installed - skipping compilation check"
    fi
fi

# 1. Verify Critical Secrets (Context-Aware)
if [[ "$*" == *"migrate"* ]]; then
    echo "INFO: Migration command detected. Relaxing validation to database only."
    REQUIRED_VARS=("DATABASE_URL")
else
    REQUIRED_VARS=("DATABASE_URL" "RPC_ENDPOINT" "PIMLICO_API_KEY")
fi

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERR: Missing critical environment variable: $var"
        exit 1
    fi
done
echo "✓ Environment Variables Validated"

# 1.5 Verify Port Isolation (BSS-38)
if [ "$PORT" == "$INTERNAL_BRIDGE_PORT" ] && [ -n "$PORT" ]; then
    echo "ERR: Port conflict detected. PORT and INTERNAL_BRIDGE_PORT cannot be the same ($PORT)."
    exit 1
fi
echo "✓ Port Isolation Verified"

# 2. Verify Database Connectivity
DB_HOST=$(echo $DATABASE_URL | sed -e 's|.*@||' -e 's|/.*||' -e 's|:.*||')
DB_PORT=$(echo $DATABASE_URL | sed -e 's|.*:||' -e 's|/.*||')
if ! nc -z -w 5 "$DB_HOST" "${DB_PORT:-5432}"; then
    echo "ERR: Database connection failed at $DB_HOST"
    exit 1
fi
echo "✓ Database Reachable"

# 3. Verify Binary Integrity
if [[ "$*" != *"migrate"* ]]; then
    if [ ! -f "/usr/local/bin/brightsky-solver" ]; then
        echo "ERR: High-speed solver binary missing from OCI layer"
        exit 1
    fi
    echo "✓ Binary Integrity Confirmed"
fi

exec "$@"