// Shared two-column layout for sign-in / sign-up screens.

import { Mountain } from "lucide-react";

const STAR_POSITIONS = [
  [80, 80], [160, 60], [240, 120], [320, 80], [440, 100],
  [520, 140], [120, 180], [280, 180], [380, 200], [480, 180],
  [80, 220], [200, 280],
];

function topoPattern(color: string, opacity: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'><g fill='none' stroke='${color}' stroke-opacity='${opacity}' stroke-width='1'><path d='M-20 60 Q 60 30 130 60 T 280 60 T 440 60'/><path d='M-20 110 Q 60 80 130 110 T 280 110 T 440 110'/><path d='M-20 160 Q 60 130 130 160 T 280 160 T 440 160'/><path d='M-20 210 Q 60 180 130 210 T 280 210 T 440 210'/><path d='M-20 260 Q 60 230 130 260 T 280 260 T 440 260'/><path d='M-20 310 Q 60 280 130 310 T 280 310 T 440 310'/><path d='M-20 360 Q 60 330 130 360 T 280 360 T 440 360'/><path d='M-20 410 Q 60 380 130 410 T 280 410 T 440 410'/></g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

interface AuthHeroLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthHeroLayout({ title, subtitle, children }: AuthHeroLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* ── Left: hero ───────────────────────────────────────────── */}
      <div
        style={{
          flex: "1.2",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(160deg, #152A20 0%, #1F3D2E 50%, #C56B3D 130%)",
        }}
      >
        {/* Topo overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: topoPattern("#FFFBF1", 0.18),
            backgroundSize: "420px 420px",
          }}
        />

        {/* Mountain silhouettes */}
        <svg
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMax slice"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <path
            d="M0 800 L0 580 L80 470 L160 540 L240 380 L320 480 L400 340 L480 460 L560 400 L600 430 L600 800 Z"
            fill="rgba(0,0,0,0.18)"
          />
          <path
            d="M0 800 L0 660 L100 580 L200 620 L280 540 L380 600 L460 540 L560 600 L600 580 L600 800 Z"
            fill="rgba(0,0,0,0.32)"
          />
          <path
            d="M0 800 L0 720 L120 680 L240 700 L360 670 L480 700 L600 680 L600 800 Z"
            fill="rgba(0,0,0,0.45)"
          />
        </svg>

        {/* Stars */}
        {STAR_POSITIONS.map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: y,
              left: x,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: "50%",
              background: "#FFFBF1",
              opacity: 0.4 + ((i * 0.1) % 0.5),
            }}
          />
        ))}

        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#FFFBF1",
          }}
        >
          <Mountain size={22} strokeWidth={1.8} style={{ color: "rgba(255,251,241,0.9)" }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: "#FFFBF1" }}>
            Park<strong style={{ fontWeight: 900 }}>Quest</strong>
          </span>
        </div>

        {/* Bottom content */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 40,
            right: 40,
            color: "#FFFBF1",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "3px",
              opacity: 0.7,
              textTransform: "uppercase",
            }}
          >
            EST. 2026 · 63 PARKS · ONE QUEST
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 58,
              letterSpacing: -1.6,
              lineHeight: 0.95,
              marginTop: 18,
            }}
          >
            Every park.<br />One journal.<br />Yours forever.
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,251,241,0.85)",
              maxWidth: 480,
              marginTop: 18,
              lineHeight: 1.5,
            }}
          >
            Log every U.S. national park you've visited, plan the next one,
            collect stamps and badges, and bring your friends along.
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 18 }}>
            {/* Avatar stack */}
            <div style={{ display: "flex" }}>
              {["A", "B", "C", "D", "E"].map((l, i) => (
                <div
                  key={l}
                  style={{
                    marginLeft: i === 0 ? 0 : -10,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: ["#2F7A4A", "#D89A3A", "#2D4F66", "#8B5DBF", "#C56B3D"][i],
                    border: "2px solid #152A20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    color: "#FFFBF1",
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#FFFBF1" }}>
                24,318 explorers
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "rgba(255,251,241,0.7)",
                  letterSpacing: "0.8px",
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                148,290 STAMPS COLLECTED
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: form ───────────────────────────────────────────── */}
      <div
        style={{
          width: 480,
          flexShrink: 0,
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "var(--bg)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "2px",
            color: "var(--ink-mute)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          NATIONAL PARK SERVICE · DIGITAL
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 32,
            color: "var(--ink)",
            letterSpacing: -0.8,
            marginTop: 8,
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-mute)", marginTop: 6 }}>
          {subtitle}
        </div>

        <div style={{ marginTop: 24 }}>{children}</div>

        <div
          style={{
            marginTop: 36,
            fontSize: 11.5,
            color: "var(--ink-mute)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          By continuing you agree to the{" "}
          <a href="#" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Terms</a>{" "}
          and{" "}
          <a href="#" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}
