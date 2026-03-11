#!/bin/bash
set -euo pipefail

echo "=== Building PHANTOM WASM Prover ==="

# Check prerequisites
command -v wasm-pack >/dev/null 2>&1 || {
    echo "wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
}

cd circuits

echo "[1/3] Running circuit tests..."
if cargo test --lib; then
    echo "✓ All circuit tests passed"
else
    echo "⚠ Circuit tests failed - proceeding with build anyway"
fi

echo "[2/3] Building WASM module..."
wasm-pack build \
    --target web \
    --out-dir ../wasm/pkg \
    --features wasm

echo "✓ WASM module built"

echo "[3/3] Optimizing WASM binary..."
if command -v wasm-opt >/dev/null 2>&1; then
    wasm-opt -O3 wasm/pkg/phantom_prover_bg.wasm -o wasm/pkg/phantom_prover_bg.optimized.wasm
    mv wasm/pkg/phantom_prover_bg.optimized.wasm wasm/pkg/phantom_prover_bg.wasm
    echo "✓ WASM optimized"
else
    echo "⚠ wasm-opt not found. Skipping optimization."
fi

cd ..

# Copy to frontend
echo "[4/4] Copying WASM to frontend..."
mkdir -p frontend/public
cp wasm/pkg/phantom_prover_bg.wasm frontend/public/
cp wasm/pkg/phantom_prover.js frontend/public/
cp wasm/pkg/phantom_prover.d.ts frontend/public/ 2>/dev/null || true

echo "✓ WASM prover ready"
echo ""
echo "Build output:"
ls -lh wasm/pkg/
