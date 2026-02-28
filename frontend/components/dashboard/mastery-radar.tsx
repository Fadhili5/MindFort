"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { MasteryRecord } from "@mindvault/types";
import { DEMO_TOPICS } from "@/lib/topics";

interface Props {
  masteryRecords: Record<string, MasteryRecord>;
}

export function MasteryRadar({ masteryRecords }: Props) {
  const data = DEMO_TOPICS.map((t) => {
    const r = masteryRecords[t.id];
    return {
      topic: t.name,
      mastery: r ? Math.min(r.repetitions / 3, 1) * 100 : 0,
    };
  });

  const allZero = data.every((d) => d.mastery === 0);

  if (allZero) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-[var(--muted)]">
        Complete a tutoring session to see mastery radar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          dataKey="mastery"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
