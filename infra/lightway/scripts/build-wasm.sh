#!/usr/bin/env bash
# build-wasm.sh — Builds lightway-core for WASM via Emscripten
# Prerequisites: Emscripten SDK (emcc), git, cmake
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WASM_OUT="$SCRIPT_DIR/../wasm"
BUILD_DIR="$SCRIPT_DIR/../.build-wasm"

command -v emcc >/dev/null 2>&1 || {
  echo "ERROR: emcc not found. Install the Emscripten SDK first:"
  echo "  https://emscripten.org/docs/getting_started/downloads.html"
  exit 1
}

mkdir -p "$BUILD_DIR" "$WASM_OUT"

# 1. Clone and build wolfSSL for WASM
if [ ! -d "$BUILD_DIR/wolfssl" ]; then
  git clone --depth 1 https://github.com/wolfSSL/wolfssl.git "$BUILD_DIR/wolfssl"
fi
cd "$BUILD_DIR/wolfssl"
emcmake cmake -B build-wasm -DWOLFSSL_DTLS=ON -DWOLFSSL_PSK=ON -DBUILD_SHARED_LIBS=OFF
cmake --build build-wasm -j"$(nproc)"

# 2. Clone and build lightway-core for WASM
if [ ! -d "$BUILD_DIR/lightway-core" ]; then
  git clone --depth 1 https://github.com/nickoppen/lightway-core.git "$BUILD_DIR/lightway-core"
fi
cd "$BUILD_DIR/lightway-core"
emcmake cmake -B build-wasm \
  -DWOLFSSL_ROOT="$BUILD_DIR/wolfssl" \
  -DCMAKE_BUILD_TYPE=Release
cmake --build build-wasm -j"$(nproc)"

# 3. Link into a single .wasm module
emcc build-wasm/src/he/*.o \
  "$BUILD_DIR/wolfssl/build-wasm/libwolfssl.a" \
  -o "$WASM_OUT/lightway.wasm" \
  -s STANDALONE_WASM=1 \
  -s EXPORTED_FUNCTIONS='["_he_init","_he_tunnel_create","_he_tunnel_send","_he_tunnel_close"]' \
  --no-entry

echo "✅  Built $WASM_OUT/lightway.wasm"
