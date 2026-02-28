#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL_FILE="${MODEL_FILE:-$ROOT_DIR/models/phi-3-mini-4k-instruct-q4_k_m.gguf}"
SAMPLES="${SAMPLES:-15}"
MAX_TOKENS="${MAX_TOKENS:-300}"
SEED="${SEED:-42}"
TEMPERATURE="${TEMPERATURE:-0.2}"
TOP_P="${TOP_P:-0.9}"
REPEAT_PENALTY="${REPEAT_PENALTY:-1.1}"
OUT_FILE="${OUT_FILE:-$ROOT_DIR/benchmarks/phi3-benchmark-$(date +%Y%m%d-%H%M%S).txt}"

if [[ ! -f "$MODEL_FILE" ]]; then
  echo "Model file not found: $MODEL_FILE" >&2
  echo "Place Phi-3 GGUF at models/phi-3-mini-4k-instruct-q4_k_m.gguf" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI not found" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT_FILE")"

health_ready() {
  curl -sS --max-time 2 "http://localhost:8080/health" >/dev/null 2>&1 || \
  curl -sS --max-time 2 "http://localhost:8080/v1/models" >/dev/null 2>&1
}

now_ms() {
  date +%s%3N
}

echo "[1/4] Starting llama-cpp service (forced recreate)..."
start_ms="$(now_ms)"
(
  cd "$ROOT_DIR"
  docker compose up -d --force-recreate llama-cpp >/dev/null
)

for _ in $(seq 1 120); do
  if health_ready; then
    break
  fi
  sleep 0.25
  if [[ $(( $(now_ms) - start_ms )) -gt 30000 ]]; then
    echo "llama-cpp did not become ready within 30s" >&2
    exit 1
  fi
done
ready_ms="$(now_ms)"
cold_start_ms="$(( ready_ms - start_ms ))"

echo "[2/4] Running latency benchmark (${SAMPLES} samples, ${MAX_TOKENS} tokens max)..."
TMP_TIMES="$(mktemp)"
trap 'rm -f "$TMP_TIMES"' EXIT

payload="$(cat <<JSON
{
  "model": "phi-3-mini-4k-instruct-q4_k_m.gguf",
  "messages": [
    {"role": "system", "content": "You are a concise adaptive math tutor."},
    {"role": "user", "content": "Explain how to solve 2x + 7 = 19 in 3 concise steps."}
  ],
  "temperature": ${TEMPERATURE},
  "top_p": ${TOP_P},
  "repeat_penalty": ${REPEAT_PENALTY},
  "seed": ${SEED},
  "max_tokens": ${MAX_TOKENS},
  "stream": false
}
JSON
)"

for i in $(seq 1 "$SAMPLES"); do
  t="$(curl -sS -o /dev/null -w '%{time_total}' \
    -H 'content-type: application/json' \
    -X POST "http://localhost:8080/v1/chat/completions" \
    -d "$payload")"
  echo "$t" >> "$TMP_TIMES"
  echo "  sample $i: ${t}s"
done

sorted="$(mktemp)"
trap 'rm -f "$TMP_TIMES" "$sorted"' EXIT
sort -n "$TMP_TIMES" > "$sorted"
count="$(wc -l < "$sorted" | tr -d ' ')"

p50_idx=$(( (count + 1) / 2 ))
p95_idx=$(( (95 * count + 99) / 100 ))
[[ "$p95_idx" -lt 1 ]] && p95_idx=1

p50="$(sed -n "${p50_idx}p" "$sorted")"
p95="$(sed -n "${p95_idx}p" "$sorted")"
avg="$(awk '{s+=$1} END {if (NR>0) printf "%.6f", s/NR; else print "0"}' "$sorted")"

echo "[3/4] Collecting RSS from running container..."
container_id="$(cd "$ROOT_DIR" && docker compose ps -q llama-cpp)"
if [[ -z "$container_id" ]]; then
  echo "Unable to resolve llama-cpp container ID" >&2
  exit 1
fi
rss="$(docker stats --no-stream --format '{{.MemUsage}}' "$container_id" | awk -F' / ' '{print $1}')"

echo "[4/4] Writing report..."
{
  echo "Phi-3 llama.cpp Benchmark"
  echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Model: $MODEL_FILE"
  echo "Samples: $SAMPLES"
  echo "Max tokens: $MAX_TOKENS"
  echo "Seed: $SEED"
  echo "Temperature: $TEMPERATURE"
  echo "Top-p: $TOP_P"
  echo "Repeat penalty: $REPEAT_PENALTY"
  echo ""
  echo "Cold start (container start -> ready): ${cold_start_ms} ms"
  echo "Latency avg: ${avg} s"
  echo "Latency p50: ${p50} s"
  echo "Latency p95: ${p95} s"
  echo "RSS: ${rss}"
  echo ""
  echo "Target checks:"
  awk -v c="$cold_start_ms" -v p95="$p95" -v rss="$rss" 'BEGIN {
    split(rss, a, " ");
    rssv=a[1]+0;
    unit=a[2];
    rss_gb = (unit=="GiB" ? rssv : (unit=="MiB" ? rssv/1024 : rssv));
    printf "- Cold start < 5000ms: %s\n", (c < 5000 ? "PASS" : "FAIL");
    printf "- P95 < 2.0s: %s\n", (p95+0 < 2.0 ? "PASS" : "FAIL");
    printf "- RSS < 3.5GiB: %s\n", (rss_gb < 3.5 ? "PASS" : "FAIL");
  }'
} | tee "$OUT_FILE"

echo "Report saved: $OUT_FILE"
