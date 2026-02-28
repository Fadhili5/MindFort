"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  useTutorStore,
  type NetworkEvent,
  type LocalProcessingEvent,
} from "@/lib/stores/tutor-store";
import { useNetworkObserver } from "@/lib/hooks/use-network-observer";

// ---------------------------------------------------------------------------
// Animated event rows
// ---------------------------------------------------------------------------

const rowVariants = {
  hidden: { opacity: 0, x: 12, height: 0 },
  visible: { opacity: 1, x: 0, height: "auto", transition: { duration: 0.25 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.15 } },
};

function NetworkRow({ event }: { event: NetworkEvent }) {
  return (
    <motion.div
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="flex items-center gap-3 py-2 px-3 rounded-lg text-xs bg-[var(--background)]"
    >
      <span
        className={`h-2 w-2 rounded-full flex-shrink-0 ${
          event.encrypted ? "bg-[var(--success)]" : "bg-[var(--danger)]"
        }`}
      />
      <span className="flex-1 truncate">{event.label}</span>
      <span className="text-[var(--muted)] flex-shrink-0">{event.sizeBytes}B</span>
      <span className="flex-shrink-0">{event.encrypted ? "🔒" : "⚠️"}</span>
    </motion.div>
  );
}

function LocalRow({ event }: { event: LocalProcessingEvent }) {
  const icons: Record<LocalProcessingEvent["component"], string> = {
    classifier: "🧠",
    sm2: "📊",
    scaffolding: "🪜",
    llm: "🤖",
  };
  return (
    <motion.div
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="flex items-center gap-3 py-2 px-3 rounded-lg text-xs bg-[var(--success)]/5 border border-[var(--success)]/10"
    >
      <span className="flex-shrink-0">{icons[event.component]}</span>
      <span className="flex-1 truncate">{event.label}</span>
      <span className="text-[var(--success)] flex-shrink-0 font-medium">local</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tunnel Status Badge
// ---------------------------------------------------------------------------

function TunnelBadge({ ready }: { ready: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        ready
          ? "bg-[var(--success)]/10 text-[var(--success)]"
          : "bg-[var(--danger)]/10 text-[var(--danger)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-[var(--success)] animate-pulse" : "bg-[var(--danger)]"}`} />
      {ready ? "Tunnel Ready" : "Tunnel Down"}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function PrivacyPanel() {
  const {
    networkEvents,
    localProcessingEvents,
    totalOutboundBytes,
    totalLocalOps,
    sessionActive,
    tunnelReady,
    modelVersion,
    federatedStatus,
  } = useTutorStore();

  // Activate real browser network monitoring
  useNetworkObserver();

  const unencryptedCount = networkEvents.filter(
    (e) => e.type === "outbound" && !e.encrypted
  ).length;

  // Merge + sort events by timestamp for a unified timeline
  type TimelineEntry =
    | { kind: "network"; event: NetworkEvent }
    | { kind: "local"; event: LocalProcessingEvent };

  const timeline: TimelineEntry[] = [
    ...networkEvents.map((e) => ({ kind: "network" as const, event: e })),
    ...localProcessingEvents.map((e) => ({ kind: "local" as const, event: e })),
  ].sort((a, b) => b.event.timestamp - a.event.timestamp);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 privacy-glow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted)]">
          Privacy Monitor
        </h3>
        <div className="flex items-center gap-2">
          <TunnelBadge ready={tunnelReady} />
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                sessionActive ? "bg-[var(--success)] animate-pulse" : "bg-[var(--muted)]"
              }`}
            />
            <span className={sessionActive ? "text-[var(--success)]" : "text-[var(--muted)]"}>
              {sessionActive ? "Live" : "Idle"}
            </span>
          </div>
        </div>
      </div>

      {/* Federated status bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--background)] text-xs">
        <div className="flex items-center gap-2">
          <span>🔗</span>
          <span className="text-[var(--muted)]">Model:</span>
          <span className="font-mono font-medium">{modelVersion}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              federatedStatus === "submitted"
                ? "bg-[var(--success)]"
                : federatedStatus === "submitting"
                ? "bg-brand-500 animate-pulse"
                : federatedStatus === "error"
                ? "bg-[var(--danger)]"
                : "bg-[var(--muted)]"
            }`}
          />
          <span className="text-[var(--muted)]">
            {federatedStatus === "submitted"
              ? "Synced"
              : federatedStatus === "submitting"
              ? "Submitting…"
              : federatedStatus === "error"
              ? "Offline"
              : "Ready"}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg bg-[var(--background)] text-center">
          <motion.div
            key={totalLocalOps}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-xl font-bold text-[var(--success)]"
          >
            {totalLocalOps}
          </motion.div>
          <div className="text-[10px] text-[var(--muted)] mt-0.5">On-Device Ops</div>
        </div>
        <div className="p-3 rounded-lg bg-[var(--background)] text-center">
          <motion.div
            key={unencryptedCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`text-xl font-bold ${unencryptedCount === 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
          >
            {unencryptedCount}
          </motion.div>
          <div className="text-[10px] text-[var(--muted)] mt-0.5">Plain Outbound</div>
        </div>
        <div className="p-3 rounded-lg bg-[var(--background)] text-center">
          <motion.div
            key={totalOutboundBytes}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-xl font-bold"
          >
            {totalOutboundBytes}
          </motion.div>
          <div className="text-[10px] text-[var(--muted)] mt-0.5">Bytes Out</div>
        </div>
      </div>

      {/* Data locality bar */}
      {(totalLocalOps > 0 || networkEvents.length > 0) && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--muted)] uppercase tracking-wider">
            <span>Local</span>
            <span>Network</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--background)] overflow-hidden flex">
            <motion.div
              className="bg-[var(--success)] rounded-l-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(totalLocalOps / Math.max(totalLocalOps + networkEvents.length, 1)) * 100}%`,
              }}
              transition={{ duration: 0.4 }}
            />
            <motion.div
              className="bg-brand-500 rounded-r-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(networkEvents.length / Math.max(totalLocalOps + networkEvents.length, 1)) * 100}%`,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Unified event timeline */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {timeline.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[var(--muted)] text-center py-4"
            >
              {sessionActive
                ? "✅ Zero outbound — all processing on-device"
                : "Start a session to monitor privacy"}
            </motion.p>
          ) : (
            timeline.slice(0, 30).map((entry) =>
              entry.kind === "network" ? (
                <NetworkRow key={entry.event.id} event={entry.event} />
              ) : (
                <LocalRow key={entry.event.id} event={entry.event} />
              )
            )
          )}
        </AnimatePresence>
      </div>

      <div className="text-[10px] text-[var(--muted)] pt-2 border-t border-[var(--border)]">
        Real telemetry via PerformanceObserver · FedAvg model {modelVersion}
      </div>
    </div>
  );
}
