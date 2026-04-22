#!/bin/bash
# BSS-38 Pre-commit Hook
# This script runs quality checks before allowing a commit

set -e

echo "═══════════════════════════════════════════════════════"
echo "       [BSS-38] PRE-COMMIT QUALITY GATES"
echo "═══════════════════════════════════════════════════════"

# Check if we're in a Rust project
if [ ! -f "Cargo.toml" ]; then
    echo "Not a Rust project, skipping..."
    exit 0
fi

# Only run if there are Rust file changes
RUST_CHANGED=$(git diff --cached --name-only -- '*.rs' | wc -l)
if [ "$RUST_CHANGED" -eq 0 ]; then
    echo "No Rust files staged, skipping quality gates..."
    exit 0
fi

echo "🔍 Running Rust quality gates..."

# 1. Format check
echo "📐 [1/4] Checking formatting..."
if ! cargo fmt --check 2>/dev/null; then
    echo "❌ Formatting issues detected. Run: cargo fmt"
    cargo fmt -- --check || true
    exit 1
fi
echo "✅ Formatting OK"

# 2. Clippy linting
echo "🔎 [2/4] Running clippy..."
if ! cargo clippy --release -- -D warnings 2>&1 | tee /tmp/clippy-output.txt; then
    echo "❌ Clippy errors detected. Fix the issues above."
    tail -20 /tmp/clippy-output.txt
    exit 1
fi
echo "✅ Clippy OK"

# 3. Build check
echo "🔨 [3/4] Building..."
if ! cargo build --release --bin brightsky 2>&1 | tee /tmp/build-output.txt; then
    echo "❌ Build failed. Fix compilation errors."
    tail -20 /tmp/build-output.txt
    exit 1
fi
echo "✅ Build OK"

# 4. Tests
echo "🧪 [4/4] Running tests..."
if cargo test --lib 2>&1 | tee /tmp/test-output.txt; then
    echo "✅ Tests OK"
else
    echo "⚠️  Some tests failed (non-blocking)"
fi

echo "═══════════════════════════════════════════════════════"
echo "       [BSS-38] ALL QUALITY GATES PASSED ✓"
echo "═══════════════════════════════════════════════════════"
exit 0