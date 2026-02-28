"use client";

import { motion } from "framer-motion";

/**
 * Visual showing what data stays on-device vs. what leaves.
 * Pure CSS + framer-motion — no chart library needed.
 */
export function DataFlowDiagram() {
  const localItems = [
    { label: "Raw answers", icon: "📝" },
    { label: "Error classification", icon: "🧠" },
    { label: "SM-2 scheduling", icon: "📊" },
    { label: "Scaffolding selection", icon: "🪜" },
    { label: "LLM inference", icon: "🤖" },
  ];

  const outboundItems = [
    { label: "Gradient (encrypted)", icon: "🔒" },
    { label: "Credential (encrypted)", icon: "⛓️" },
  ];

  return (
    <div className="space-y-4">
      {/* Device boundary */}
      <div className="rounded-lg border-2 border-dashed border-[var(--success)]/30 p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--success)] font-semibold flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
          Stays on device
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {localItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded bg-[var(--success)]/5"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[var(--muted)] text-xs flex flex-col items-center gap-0.5"
        >
          <span>▼</span>
          <span>session end only</span>
          <span>▼</span>
        </motion.div>
      </div>

      {/* Network boundary */}
      <div className="rounded-lg border-2 border-dashed border-brand-500/30 p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          Leaves device (Lightway DTLS)
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {outboundItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded bg-brand-500/5"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
