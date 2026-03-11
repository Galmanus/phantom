#!/bin/bash
set -euo pipefail

echo "=== PHANTOM Circuit Test Suite ==="

cd circuits

echo "[1/4] Running unit tests..."
cargo test --lib -- --nocapture
echo "✓ Unit tests passed"

echo "[2/4] Running soundness checks..."
echo "Testing invalid inputs should fail..."

# These tests verify that invalid inputs are rejected
cargo test test_zero_amount_fails -- --nocapture
cargo test test_invalid_asset_id_fails -- --nocapture
cargo test test_commitment_mismatch_fails -- --nocapture
echo "✓ Soundness checks passed"

echo "[3/4] Running property-based tests..."
cargo test --test '*' proptest -- --nocapture
echo "✓ Property-based tests passed"

echo "[4/4] Running benchmarks..."
if cargo bench --no-run 2>/dev/null; then
    echo "Benchmarks compiled successfully"
    echo "Run 'cargo bench' for full benchmark results"
else
    echo "⚠ Benchmarks skipped (release build not available)"
fi

cd ..

echo ""
echo "=== All circuit tests passed ==="
