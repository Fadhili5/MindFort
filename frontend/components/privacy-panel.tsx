"use client";

import { useEffect, useMemo, useState } from "react";
import { observeNetworkTraffic, type NetworkMetric } from "@/lib/privacy-observer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PrivacyPanelProps {
  sessionActive: boolean;
  demoMode?: boolean;
}

function summarizeTraffic(events: NetworkMetric[]): {
  totalTransfer: number;
  outboundCount: number;
} {
  return events.reduce(
    (acc, event) => {
      const isOutbound = event.transferSize > 0;
      return {
        totalTransfer: acc.totalTransfer + event.transferSize,
        outboundCount: acc.outboundCount + (isOutbound ? 1 : 0)
      };
    },
    { totalTransfer: 0, outboundCount: 0 }
  );
}

export function PrivacyPanel({ sessionActive, demoMode = false }: PrivacyPanelProps) {
  const [events, setEvents] = useState<NetworkMetric[]>([]);

  useEffect(() => {
    const stop = observeNetworkTraffic((event) => {
      setEvents((previous) => [event, ...previous].slice(0, 25));
    });
    return () => stop();
  }, []);

  const syntheticLightwayPacket: NetworkMetric | null = useMemo(
    () => demoMode
      ? {
          name: "lightway://dtls12/ml-kem",
          initiatorType: "fetch",
          transferSize: 184,
          encodedBodySize: 184,
          startTime: 0,
          duration: 8
        }
      : null,
    [demoMode]
  );

  const renderedEvents = useMemo(() => {
    if (!syntheticLightwayPacket) {
      return events;
    }
    return [syntheticLightwayPacket, ...events];
  }, [events, syntheticLightwayPacket]);

  const summary = useMemo(() => summarizeTraffic(renderedEvents), [renderedEvents]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Privacy Telemetry</span>
          <Badge className={sessionActive && summary.outboundCount === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
            {sessionActive && summary.outboundCount === 0 ? "Zero Outbound During Session" : "Observed Network Activity"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Outbound Requests</p>
            <p className="mt-1 text-2xl font-semibold">{summary.outboundCount}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Transfer Size</p>
            <p className="mt-1 text-2xl font-semibold">{summary.totalTransfer}B</p>
          </div>
        </div>
        <div className="rounded-md border border-border">
          <div className="border-b border-border p-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            PerformanceObserver Feed
          </div>
          <div className="max-h-52 overflow-auto p-2 text-xs">
            {renderedEvents.length === 0 ? (
              <p className="text-slate-500">No resource entries observed yet.</p>
            ) : (
              renderedEvents.map((event, index) => (
                <div className="mb-2 rounded bg-slate-100 p-2" key={`${event.name}-${index}`}>
                  <p className="truncate font-medium">{event.name}</p>
                  <p>
                    {event.initiatorType} | {Math.round(event.duration)}ms | {event.transferSize}B
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
