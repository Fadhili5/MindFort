# MindVault — Infrastructure

Deployment configs, tunnelling, and supporting services.

## Contents

| Directory     | Description                                    |
| ------------- | ---------------------------------------------- |
| `federated/`  | Python FedAvg aggregation server (FastAPI)     |
| `lightway/`   | Lightway DTLS tunnel (stub + WASM loader)      |
| `ollama/`     | Ollama LLM sidecar config (Modelfile)          |

## Docker

All services are orchestrated via the root `docker-compose.yml`:

```bash
docker compose up --build
```
