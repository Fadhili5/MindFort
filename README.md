# MindVault

Privacy-first adaptive tutoring platform with on-device tutoring inference, federated learning, and post-quantum credential attestations.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Federated: `http://localhost:8081`
- Phi-3 llama.cpp: `http://localhost:8080`
- Lightway: `http://localhost:8090`

## Architecture

- `frontend`: Next.js 15 App Router UI with WebLLM client, tutor UI, privacy panel, dashboard, and wallet.
- `backend`: Fastify API with Zod validation, JWT pseudo-auth, credential minting, federated forwarding, and Phi-3 inference proxy.
- `infra/federated`: FastAPI FedAvg aggregation server.
- `infra/lightway`: Lightway/libhelium integration service with N-API bridge and fallback.
- `infra/llama-cpp`: CPU-only llama.cpp server for Phi-3 GGUF inference.
- `packages/mastery-engine`: pure TypeScript adaptive mastery logic.
- `packages/llm-client`: provider-agnostic LLM client abstraction.
- `packages/abelian-client`: Abelian UTXO transaction wrapper.
- `packages/api-types`: shared Zod schemas and API contracts.
- `packages/demo-controller`: deterministic demo orchestration.

## Demo Mode

Set `DEMO_MODE=true` to enable deterministic demo sequence and automatic credential path.

## Added Production Features

- Interleaved review sessions in `@mindvault/mastery-engine` via `getInterleavedSession(topics)` with SM-2 due-topic selection.
- Offline tutoring queue with IndexedDB-backed gradient and credential sync (`frontend/lib/offlineQueue.ts`).
- Student-owned wallet flow at `/wallet` with 12-word BIP-39 generation, local-only mnemonic storage, and Abelian verification link.
- Parent dashboard mastery heatmap with SM-2 review metadata tooltips plus downloadable privacy transparency PDF.
- Gradient integrity guard middleware (`backend/src/middleware/gradientGuard.ts`) enforcing payload caps, strict schema checks, anomaly logging, and duplicate detection.
- Idempotent credential minting with wallet-address support on `/api/credential/mint`.
- Federated model version API (`/api/model/version`) with `modelVersion`, `lastAggregatedAt`, and `totalClients`.
- Deterministic demo orchestration package (`@mindvault/demo-controller`) for repeatable 2-incorrect/1-correct runs and automatic credential mint path.
- Backend LLM refactor from Ollama to Phi-3 Mini GGUF served by llama.cpp.
