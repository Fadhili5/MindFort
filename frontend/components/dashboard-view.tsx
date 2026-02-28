"use client";

import headerImg from "@/styles/headerimg.png";

const LEVELS = [
  { level: 1, biome: "Tropical", color: "#24b0d8" },
  { level: 2, biome: "Desert", color: "#f59e0b" },
  { level: 3, biome: "Polar", color: "#8b7cf4" },
  { level: 4, biome: "Marine", color: "#4f8dd9" },
  { level: 5, biome: "Coastal", color: "#0ea5a8" },
  { level: 6, biome: "Swampland", color: "#1d4ed8" },
  { level: 7, biome: "Rainforest", color: "#14b8a6" },
  { level: 8, biome: "Highland", color: "#eab308" },
  { level: 9, biome: "Forest", color: "#8b5cf6" },
  { level: 10, biome: "Grassland", color: "#9ca3af" }
];

const GOALS = [
  { title: "Lightsail", top: "480 / 600 Minutes", current: 60, max: 80, unit: "Minutes", last: "Last Week: 30 / 80 Minutes", color: "#f5b93e", badge: "#e4faf0" },
  { title: "Lexia", top: "150 / 210 Units", current: 21, max: 80, unit: "Units", last: "Last Week: 45 / 95 Units", color: "#ef4444", badge: "#fff3df" },
  { title: "Zearn", top: "60 / 90 Lessons", current: 3, max: 4, unit: "Lessons", last: "Last Week: 3 / 3 Lessons", color: "#2dc9a7", badge: "#dbf7f2" },
  { title: "STMath", top: "30 / 75 Puzzles", current: 1, max: 12, unit: "Lessons", last: "Last Week: 5 / 10 Lessons", color: "#9ca3af", badge: "#fff3df" },
  { title: "Freckle Fluency", top: "4 / 100 Sessions", current: 4, max: 15, unit: "Sessions", last: "Last Week: 30 / 30 Sessions", color: "#f5b93e", badge: "#dbf7f2" },
  { title: "Lexia English", top: "250 / 800 Minutes", current: 41, max: 100, unit: "Minutes", last: "Last Week: 5 / 35 Minutes", color: "#f5b93e", badge: "#ffe9e3" }
];

function initials(label: string): string {
  const parts = label.split(" ");
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function Ring({
  value,
  max,
  color,
  unit
}: {
  value: number;
  max: number;
  color: string;
  unit: string;
}) {
  const p = Math.min(100, Math.round((value / max) * 100));
  const r = 35;
  const c = 2 * Math.PI * r;
  const o = c - (p / 100) * c;

  return (
    <div style={{ width: 102, height: 102, margin: "0.65rem auto", position: "relative" }}>
      <svg width="102" height="102" viewBox="0 0 102 102">
        <circle cx="51" cy="51" r={r} fill="none" stroke="#eceff3" strokeWidth="8" />
        <circle
          cx="51"
          cy="51"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={c}
          strokeDashoffset={o}
          strokeLinecap="round"
          transform="rotate(-90 51 51)"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          right: 0,
          top: 2,
          width: 17,
          height: 17,
          borderRadius: 999,
          background: "#e2e8f0",
          border: "1px solid #cbd5e1"
        }}
      />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <p style={{ margin: 0, color, fontWeight: 800, fontSize: "1.3rem", lineHeight: 1 }}>
            {value}
            <span style={{ fontSize: "0.82rem", color: "#9ca3af", fontWeight: 500 }}>/{max}</span>
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.73rem", color: "#6b7280" }}>{unit}</p>
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  title,
  top,
  current,
  max,
  unit,
  last,
  color,
  badge
}: {
  title: string;
  top: string;
  current: number;
  max: number;
  unit: string;
  last: string;
  color: string;
  badge: string;
}) {
  return (
    <div style={{ border: "1px solid #ececec", borderRadius: 10, background: "#fff", padding: "0.8rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: badge,
            display: "grid",
            placeItems: "center",
            fontSize: "0.62rem",
            color: "#334155",
            fontWeight: 800,
            letterSpacing: "0.03em"
          }}
        >
          {initials(title)}
        </div>
        <div>
          <p style={{ margin: 0, color: "#1f2937", fontWeight: 700, fontSize: "0.94rem" }}>{title}</p>
          <p style={{ margin: "1px 0 0", fontSize: "0.63rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>EOY GOALS</p>
          <p style={{ margin: 0, fontSize: "0.74rem", color: "#475569" }}>{top}</p>
        </div>
      </div>
      <Ring value={current} max={max} color={color} unit={unit} />
      <div style={{ marginTop: "0.2rem", borderRadius: 6, background: "#f8fafc", color: "#64748b", fontSize: "0.73rem", textAlign: "center", padding: "0.36rem 0.5rem" }}>
        {last}
      </div>
    </div>
  );
}

export function DashboardView() {
  const today = "May 30th, 2022";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <section
        style={{
          borderRadius: 14,
          minHeight: 170,
          padding: "1rem 1.2rem",
          color: "#fff",
          backgroundImage: `linear-gradient(180deg, rgba(8,14,44,0.42) 0%, rgba(14,49,49,0.24) 100%), url(${headerImg.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <p style={{ margin: 0, fontSize: "0.64rem", textTransform: "uppercase", letterSpacing: "0.09em", opacity: 0.9 }}>Week of</p>
        <h2 style={{ margin: "0.25rem 0 0.55rem", fontSize: "2rem", fontWeight: 800 }}>
          {today} <span style={{ opacity: 0.88, fontWeight: 600, fontSize: "1.45rem" }}>(Week 3)</span>
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ borderRadius: 999, background: "#4f46e5", padding: "0.23rem 0.6rem", fontSize: "0.74rem", fontWeight: 800 }}>Level 9</span>
          <span style={{ borderRadius: 999, background: "rgba(255,255,255,0.2)", padding: "0.23rem 0.6rem", fontSize: "0.74rem", fontWeight: 700 }}>Stage 5</span>
          <span style={{ borderRadius: 999, background: "rgba(255,255,255,0.2)", padding: "0.23rem 0.6rem", fontSize: "0.74rem", fontWeight: 700 }}>Forest</span>
        </div>
      </section>

      <section style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "0.65rem", display: "flex", gap: 10, alignItems: "center" }}>
        <div className="scrollbar-none" style={{ display: "flex", gap: 8, overflowX: "auto", flex: 1, paddingBottom: 2 }}>
          {LEVELS.map((l) => (
            <div key={l.level} style={{ minWidth: 78 }}>
              <div style={{ borderRadius: 10, border: l.level === 9 ? "2px solid #0f172a" : "1px solid #d7dce3", height: 50, background: l.color, display: "grid", placeItems: "center", color: "#fff", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.03em" }}>
                L{l.level}
              </div>
              <p style={{ margin: "0.26rem 0 0", fontSize: "0.63rem", color: "#94a3b8", textAlign: "center" }}>Level {l.level}</p>
              <p style={{ margin: "0.05rem 0 0", fontSize: "0.69rem", color: "#1e293b", textAlign: "center", fontWeight: 700 }}>{l.biome}</p>
            </div>
          ))}
        </div>
        <div style={{ width: 215, borderLeft: "1px solid #e5e7eb", paddingLeft: 10 }}>
          <p style={{ margin: 0, fontSize: "0.62rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Choose your favorite marker</p>
          <p style={{ margin: "0.18rem 0 0.45rem", fontSize: "0.76rem", color: "#0f172a", fontWeight: 800 }}>Level 9 - Forest</p>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                style={{
                  width: 31,
                  height: 31,
                  borderRadius: "50%",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "0.69rem",
                  color: "#475569",
                  fontWeight: 700
                }}
              >
                M{n}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: "0 1 252px", minWidth: 220, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "0.95rem" }}>
            <div style={{ height: 118, borderRadius: 10, background: "linear-gradient(135deg,#9fd6ff,#dbeafe)", display: "grid", placeItems: "center", fontSize: "0.8rem", color: "#334155", fontWeight: 800, letterSpacing: "0.04em" }}>
              WEEK PLANNER
            </div>
            <h3 style={{ margin: "0.7rem 0 0.42rem", color: "#111827", fontSize: "1rem", fontWeight: 800 }}>Would you like to plan your week first?</h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.84rem", lineHeight: 1.5 }}>
              There are dreamers and there are planners, the planners make their dreams come true.
            </p>
            <button type="button" style={{ marginTop: "0.75rem", border: "none", borderRadius: 7, background: "#11183f", color: "#fff", fontSize: "0.68rem", fontWeight: 800, padding: "0.56rem 0.88rem", cursor: "pointer" }}>
              PLAN YOUR WEEK
            </button>
          </div>

          <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "0.8rem" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your reflections from last week</p>
            <p style={{ margin: "0.45rem 0 0", color: "#0f172a", fontWeight: 700, fontSize: "0.88rem" }}>I have not completed my weekly goals yet.</p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "0.8rem" }}>
            <p style={{ margin: 0, color: "#0f172a", fontSize: "0.9rem", fontWeight: 700 }}>Feedback for you</p>
            <p style={{ margin: "0.3rem 0 0", color: "#9ca3af" }}>No new feedback yet.</p>
          </div>
        </div>

        <div style={{ flex: "1 1 560px", minWidth: 310, background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "0.95rem" }}>
          <h3 style={{ margin: 0, color: "#111827", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>Your Goals</h3>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {GOALS.map((g) => (
              <GoalCard key={g.title} {...g} />
            ))}
            <div style={{ borderRadius: 10, border: "1px solid #ececec", background: "#f4f4ff", display: "grid", placeItems: "center", textAlign: "center", minHeight: 236, padding: "1rem" }}>
              <div>
                <p style={{ margin: 0, color: "#4c1d95", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>Reflection</p>
                <p style={{ margin: "0.43rem 0 0", color: "#1f2937", fontWeight: 700 }}>How are you feeling about your progress this week?</p>
                <p style={{ margin: "0.5rem 0 0", color: "#64748b", fontSize: "0.75rem", fontWeight: 700 }}>ADD YOUR REFLECTIONS</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
