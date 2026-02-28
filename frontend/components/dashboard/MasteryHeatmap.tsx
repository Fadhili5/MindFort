"use client";

import { Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { MasteryState } from "@mindvault/mastery-engine";

interface MasteryHeatmapProps {
  topicStates: Record<string, MasteryState>;
}

interface HeatPoint {
  x: number;
  y: number;
  z: number;
  topic: string;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  intervalDays: number;
}

function colorFor(score: number): string {
  if (score < 50)  return "#ef4444";
  if (score <= 85) return "#f59e0b";
  return "#10b981";
}

export function MasteryHeatmap({ topicStates }: MasteryHeatmapProps) {
  const entries = Object.values(topicStates);
  const data: HeatPoint[] = entries.map((state, index) => ({
    x: index + 1,
    y: Math.round(state.masteryScore * 100),
    z: 500,
    topic: state.topic,
    lastReviewedAt: state.lastReviewedAt,
    nextReviewAt: state.nextReviewAt,
    intervalDays: state.intervalDays
  }));

  return (
    <div style={{ borderRadius: 16, border: "1px solid #f3f4f6", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "1.25rem 1.5rem 0.25rem" }}>
        <h3 style={{ fontWeight: 700, color: "#1f2937", margin: 0 }}>Mastery Heatmap</h3>
      </div>
      <div style={{ height: 320, padding: "0 1.5rem 1.5rem" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              dataKey="x"
              name="Topic Index"
              tickFormatter={(value) => {
                const index = Number(value) - 1;
                return data[index]?.topic ?? String(value);
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis dataKey="y" domain={[0, 100]} name="Mastery %" tick={{ fontSize: 12 }} />
            <ZAxis dataKey="z" range={[500, 500]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              formatter={(value, name, props) => {
                if (name === "y") {
                  return [`${String(value)}%`, "Mastery"];
                }
                if (name === "x") {
                  const topicName = (props.payload as HeatPoint | undefined)?.topic ?? "Topic";
                  return [topicName, "Topic"];
                }
                return [String(value), name];
              }}
              labelFormatter={(_label, payload) => {
                const point = payload?.[0]?.payload as HeatPoint | undefined;
                if (!point) return "";
                const lastReviewed = point.lastReviewedAt ? new Date(point.lastReviewedAt).toLocaleString() : "Never";
                const nextReview   = point.nextReviewAt   ? new Date(point.nextReviewAt).toLocaleString()   : "Unscheduled";
                return `Last: ${lastReviewed} | Next: ${nextReview} | Interval: ${point.intervalDays}d`;
              }}
            />
            <Scatter data={data}>
              {data.map((entry, index) => (
                <Cell key={`${entry.topic}-${index}`} fill={colorFor(entry.y)} fillOpacity={0.9} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
