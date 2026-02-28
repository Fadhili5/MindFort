"use client";

import { QuestionCard } from "@/components/tutor/question-card";
import { MasteryProgress } from "@/components/tutor/mastery-progress";
import { SessionControls } from "@/components/tutor/session-controls";
import { PrivacyPanel } from "@/components/privacy-panel/privacy-panel";
import { useTutorStore } from "@/lib/stores/tutor-store";

export default function TutorPage() {
  const { sessionActive } = useTutorStore();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Adaptive Tutor</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          AI-powered tutoring running entirely on your device
        </p>
      </div>

      {/* Split-screen: Tutor | Privacy Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tutor area */}
        <div className="lg:col-span-2 space-y-4">
          <SessionControls />
          {sessionActive && <QuestionCard />}
          <MasteryProgress />
        </div>

        {/* Right: Privacy panel */}
        <div className="space-y-4">
          <PrivacyPanel />

          {/* Privacy explainer */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted)]">
              How It Works
            </h3>
            <ul className="text-xs text-[var(--muted)] space-y-2">
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                Questions generated on-device — zero network traffic
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                Error classification runs locally — mistakes never leave
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                Only gradients + credentials sent at session end
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                All outbound traffic wrapped in Lightway DTLS tunnel
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
