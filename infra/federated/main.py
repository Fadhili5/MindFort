"""
MindVault Federated Learning Server — FedAvg gradient aggregator.

Receives gradient payloads from the API server via Lightway tunnel,
runs FedAvg aggregation, and serves updated global model weights.
"""

from fastapi import FastAPI
from pydantic import BaseModel
import base64
import time
import struct

app = FastAPI(title="MindVault Federated Server")

# --- In-memory state ---
current_model_version = "v0.0.1"
current_weights: bytes = b""
gradient_buffer: list[dict] = []
MIN_GRADIENTS_FOR_AGGREGATION = 2


class GradientPayload(BaseModel):
    gradients: str        # base64-encoded Float32Array
    sampleCount: int
    modelVersion: str
    timestamp: int


class GradientAckResponse(BaseModel):
    accepted: bool
    newModelVersion: str | None = None


class GlobalModelUpdate(BaseModel):
    modelVersion: str
    weights: str          # base64-encoded
    publishedAt: int


def fedavg_aggregate(buffers: list[dict]) -> bytes:
    """Simple FedAvg: weighted average of gradient buffers by sample count."""
    if not buffers:
        return b""

    total_samples = sum(b["sampleCount"] for b in buffers)
    if total_samples == 0:
        return b""

    # Decode all gradient arrays
    arrays = []
    for b in buffers:
        raw = base64.b64decode(b["gradients"])
        floats = struct.unpack(f"<{len(raw)//4}f", raw)
        arrays.append((floats, b["sampleCount"]))

    # Weighted average
    length = len(arrays[0][0])
    averaged = [0.0] * length
    for floats, count in arrays:
        weight = count / total_samples
        for i in range(min(length, len(floats))):
            averaged[i] += floats[i] * weight

    return struct.pack(f"<{length}f", *averaged)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/gradients", response_model=GradientAckResponse)
async def submit_gradient(payload: GradientPayload):
    global current_model_version, current_weights

    gradient_buffer.append(payload.model_dump())

    # Aggregate when buffer is full
    if len(gradient_buffer) >= MIN_GRADIENTS_FOR_AGGREGATION:
        aggregated = fedavg_aggregate(gradient_buffer)
        gradient_buffer.clear()

        # Bump version
        parts = current_model_version.lstrip("v").split(".")
        parts[-1] = str(int(parts[-1]) + 1)
        current_model_version = "v" + ".".join(parts)
        current_weights = aggregated

        return GradientAckResponse(
            accepted=True,
            newModelVersion=current_model_version,
        )

    return GradientAckResponse(accepted=True, newModelVersion=None)


@app.get("/model", response_model=GlobalModelUpdate)
async def get_model():
    return GlobalModelUpdate(
        modelVersion=current_model_version,
        weights=base64.b64encode(current_weights).decode(),
        publishedAt=int(time.time() * 1000),
    )
