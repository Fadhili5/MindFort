from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, List, Set

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


class GradientVector(BaseModel):
    layer: str = Field(min_length=1)
    values: List[float] = Field(min_length=1)


class AggregateRequest(BaseModel):
    pseudoId: str = Field(min_length=6, max_length=64)
    round: int = Field(gt=0)
    sampleCount: int = Field(gt=0)
    gradients: List[GradientVector] = Field(min_length=1)

    @field_validator("gradients")
    @classmethod
    def disallow_raw_session_fields(cls, gradients: List[GradientVector]) -> List[GradientVector]:
        blocked = ("answer", "prompt", "session", "raw", "text")
        if any(any(token in item.layer.lower() for token in blocked) for item in gradients):
            raise ValueError("Raw session fields are not allowed in gradients")
        return gradients


class WeightsResponse(BaseModel):
    round: int
    weights: List[GradientVector]


class ModelVersionResponse(BaseModel):
    modelVersion: str
    lastAggregatedAt: str | None
    totalClients: int


@dataclass
class RoundAccumulator:
    weighted_sum: Dict[str, List[float]]
    total_samples: int


class FederatedState:
    def __init__(self) -> None:
        self._lock = Lock()
        self._round = 0
        self._weights: Dict[str, List[float]] = {}
        self._last_aggregated_at: datetime | None = None
        self._clients: Set[str] = set()

    def aggregate(self, update: AggregateRequest) -> int:
        with self._lock:
            current_round = max(self._round, update.round)
            accumulator = RoundAccumulator(weighted_sum={}, total_samples=0)

            for gradient in update.gradients:
                existing = self._weights.get(gradient.layer)
                if existing and len(existing) != len(gradient.values):
                    raise ValueError(f"Layer dimension mismatch for {gradient.layer}")

                if gradient.layer not in accumulator.weighted_sum:
                    accumulator.weighted_sum[gradient.layer] = [0.0] * len(gradient.values)

                for idx, value in enumerate(gradient.values):
                    accumulator.weighted_sum[gradient.layer][idx] += value * update.sampleCount

            accumulator.total_samples += update.sampleCount

            if accumulator.total_samples == 0:
                raise ValueError("No samples provided for aggregation")

            for layer, weighted_values in accumulator.weighted_sum.items():
                averaged = [value / float(accumulator.total_samples) for value in weighted_values]
                self._weights[layer] = averaged

            self._round = current_round
            self._clients.add(update.pseudoId)
            self._last_aggregated_at = datetime.now(timezone.utc)
            return self._round

    def snapshot(self) -> WeightsResponse:
        with self._lock:
            weights = [GradientVector(layer=layer, values=values) for layer, values in self._weights.items()]
            return WeightsResponse(round=self._round, weights=weights)

    def model_version(self) -> ModelVersionResponse:
        with self._lock:
            return ModelVersionResponse(
                modelVersion=f"fedavg-r{self._round}",
                lastAggregatedAt=self._last_aggregated_at.isoformat() if self._last_aggregated_at else None,
                totalClients=len(self._clients),
            )


state = FederatedState()
app = FastAPI(title="MindVault Federated Server", version="1.0.0")


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/aggregate")
def aggregate(request: AggregateRequest) -> dict[str, int | bool]:
    try:
        round_number = state.aggregate(request)
        return {"accepted": True, "round": round_number}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/weights", response_model=WeightsResponse)
def weights() -> WeightsResponse:
    return state.snapshot()


@app.get("/model/version", response_model=ModelVersionResponse)
def model_version() -> ModelVersionResponse:
    return state.model_version()
