"use client";

import { motion } from "framer-motion";
import { useTutorStore, type MockCredential } from "@/lib/stores/tutor-store";
import { DEMO_TOPICS } from "@/lib/topics";
import { MasteryRadar } from "@/components/dashboard/mastery-radar";
import { DataFlowDiagram } from "@/components/dashboard/data-flow";

// ---------------------------------------------------------------------------
// Stat card with scale animation on mount
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]"
    >
      <div className={`text-3xl font-bold ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-[var(--muted)] mt-1">{label}</div>
      {sub && <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Credential card
// ---------------------------------------------------------------------------

function CredentialCard({ cred }: { cred: MockCredential }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-lg bg-[var(--background)] border border-[var(--success)]/20 space-y-2"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center text-lg">
          ⛓️
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium capitalize">
            {cred.topicId.replace(/_/g, " ")}
          </div>
          <div className="text-[10px] text-[var(--muted)]">
            Score: {(cred.score * 100).toFixed(0)}% · {new Date(cred.mintedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="space-y-1 text-[10px] font-mono text-[var(--muted)] bg-[var(--card)] p-2 rounded">
        <div className="flex justify-between">
          <span>TX</span>
          <span className="truncate ml-2">{cred.txId}</span>
        </div>
        <div className="flex justify-between">
          <span>PK</span>
          <span className="truncate ml-2">{cred.studentPublicKey}</span>
        </div>
        <div className="flex justify-between">
          <span>Sig</span>
          <span className="truncate ml-2">{cred.signature}</span>
        </div>
      </div>
      <div className="text-[10px] text-[var(--success)]">
        Dilithium-signed · Abelian UTXO · Student-owned
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const {
    masteryRecords,
    masteredTopics,
    totalOutboundBytes,
    totalLocalOps,
    sessionHistory,
    credentials,
  } = useTutorStore();

  const records = Object.values(masteryRecords);
  const overallProgress =
    records.length > 0
      ? records.reduce((sum, r) => sum + Math.min(r.repetitions / 3, 1), 0) /
        DEMO_TOPICS.length
      : 0;

  const totalQuestions = sessionHistory.reduce((s, h) => s + h.questionsAnswered, 0);
  const totalCorrect = sessionHistory.reduce((s, h) => s + h.correctCount, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Monitor your child&apos;s learning — no raw session data stored, only mastery attestations
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Sessions" value={sessionHistory.length} accent="text-brand-500" />
        <StatCard label="Questions" value={totalQuestions} sub={`${accuracy}% accuracy`} accent="text-brand-500" />
        <StatCard label="Topics Mastered" value={masteredTopics.length} sub={`of ${DEMO_TOPICS.length}`} accent="text-[var(--success)]" />
        <StatCard label="Progress" value={`${Math.round(overallProgress * 100)}%`} accent="text-brand-500" />
        <StatCard label="Data Sent" value={`${totalOutboundBytes}B`} sub={`${totalLocalOps} ops on-device`} accent="text-[var(--muted)]" />
      </div>

      {/* Two-column: Radar chart | Data flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold text-sm mb-2">Mastery Radar</h3>
          <MasteryRadar masteryRecords={masteryRecords} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold text-sm mb-2">Data Flow</h3>
          <p className="text-[10px] text-[var(--muted)] mb-3">
            What stays on your child&apos;s device vs. what leaves
          </p>
          <DataFlowDiagram />
        </div>
      </div>

      {/* Mastery table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-sm">Topic Mastery</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
            <tr>
              <th className="px-5 py-2 text-left">Topic</th>
              <th className="px-5 py-2 text-left">Subject</th>
              <th className="px-5 py-2 text-center">Reps</th>
              <th className="px-5 py-2 text-center">Ease</th>
              <th className="px-5 py-2 text-center">Interval</th>
              <th className="px-5 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_TOPICS.map((topic) => {
              const r = masteryRecords[topic.id];
              return (
                <tr
                  key={topic.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]/50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{topic.name}</td>
                  <td className="px-5 py-3 text-[var(--muted)] capitalize">{topic.subject}</td>
                  <td className="px-5 py-3 text-center">{r?.repetitions ?? 0}/3</td>
                  <td className="px-5 py-3 text-center">{r ? r.easeFactor.toFixed(1) : "—"}</td>
                  <td className="px-5 py-3 text-center">{r ? `${r.intervalDays}d` : "—"}</td>
                  <td className="px-5 py-3 text-center">
                    {r?.mastered ? (
                      <span className="inline-flex items-center gap-1 text-[var(--success)] font-medium text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> Mastered
                      </span>
                    ) : r ? (
                      <span className="text-[var(--warning)] text-xs">In Progress</span>
                    ) : (
                      <span className="text-[var(--muted)] text-xs">Not Started</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Credentials */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-sm">Quantum-Resistant Credentials</h3>
          <p className="text-[10px] text-[var(--muted)] mt-1">
            Each credential is a UTXO on the Abelian chain, signed with CRYSTALS-Dilithium —
            your child owns them via a standard seed phrase, no MindVault account required
          </p>
        </div>

        {credentials.length === 0 ? (
          <div className="text-sm text-[var(--muted)] text-center py-6 bg-[var(--background)] rounded-lg">
            No credentials yet — master a topic to mint one
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {credentials.map((cred) => (
              <CredentialCard key={cred.txId} cred={cred} />
            ))}
          </div>
        )}
      </div>

      {/* Session history */}
      {sessionHistory.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-sm">Session History</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-2 text-left">Session</th>
                <th className="px-5 py-2 text-center">Questions</th>
                <th className="px-5 py-2 text-center">Correct</th>
                <th className="px-5 py-2 text-center">Credentials</th>
                <th className="px-5 py-2 text-center">Local Ops</th>
                <th className="px-5 py-2 text-center">Bytes Out</th>
              </tr>
            </thead>
            <tbody>
              {sessionHistory.map((s, i) => (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-5 py-3 font-medium">#{i + 1}</td>
                  <td className="px-5 py-3 text-center">{s.questionsAnswered}</td>
                  <td className="px-5 py-3 text-center text-[var(--success)]">{s.correctCount}</td>
                  <td className="px-5 py-3 text-center">{s.credentialsMinted}</td>
                  <td className="px-5 py-3 text-center text-[var(--success)]">{s.localOps}</td>
                  <td className="px-5 py-3 text-center text-[var(--muted)]">{s.bytesOut}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Privacy promise */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold text-sm mb-3">Privacy Promise</h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          MindVault runs entirely on your child&apos;s device — like a calculator that never phones
          home. When your child gets a question wrong, the tutor figures out why and adapts. None
          of that — the mistakes, the hesitations, the struggle — ever leaves the device. The
          only thing sent is a small encrypted badge when your child masters a topic, tunnelled
          through Lightway DTLS. That badge proves they learned it, without revealing how they got
          there.
        </p>
      </div>
    </div>
  );
}
