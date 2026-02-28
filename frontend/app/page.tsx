import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Learn Without{" "}
          <span className="text-brand-500">Surveillance</span>
        </h1>
        <p className="text-lg text-[var(--muted)] leading-relaxed">
          MindVault runs AI inference on your device. Your mistakes, hesitations, and
          learning journey never leave your machine. The model gets smarter through
          federated learning — without centralising your data.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/tutor"
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
        >
          Start Tutoring
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-[var(--border)] hover:border-brand-500 rounded-lg font-medium transition-colors"
        >
          View Dashboard
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-8 max-w-3xl w-full">
        {[
          { icon: "🔒", title: "On-Device AI", desc: "LLM runs locally via WebGPU — zero outbound data during sessions" },
          { icon: "🧠", title: "Adaptive Pedagogy", desc: "SM-2 spaced repetition, error classification, scaffolded feedback" },
          { icon: "⛓️", title: "Quantum-Resistant Credentials", desc: "Mastery attestations minted as UTXOs on the Abelian chain" },
        ].map((f) => (
          <div key={f.title} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-[var(--muted)]">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
