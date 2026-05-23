"use client";

import { useRef } from "react";
import { Map, Pencil, Award, Compass } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function topoPattern(color: string, opacity: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'><g fill='none' stroke='${color}' stroke-opacity='${opacity}' stroke-width='1'><path d='M-20 60 Q 60 30 130 60 T 280 60 T 440 60'/><path d='M-20 110 Q 60 80 130 110 T 280 110 T 440 110'/><path d='M-20 160 Q 60 130 130 160 T 280 160 T 440 160'/><path d='M-20 210 Q 60 180 130 210 T 280 210 T 440 210'/><path d='M-20 260 Q 60 230 130 260 T 280 260 T 440 260'/><path d='M-20 310 Q 60 280 130 310 T 280 310 T 440 310'/><path d='M-20 360 Q 60 330 130 360 T 280 360 T 440 360'/><path d='M-20 410 Q 60 380 130 410 T 280 410 T 440 410'/></g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const ANIMATIONS = `
  @keyframes pqStarTwinkle { 0%,100% { opacity: var(--o,0.7) } 50% { opacity: calc(var(--o,0.7) * 0.35) } }
  @keyframes pqMountainDriftA { 0%,100% { transform: translateX(0) translateY(0) } 50% { transform: translateX(-1.2%) translateY(0.3%) } }
  @keyframes pqMountainDriftB { 0%,100% { transform: translateX(0) } 50% { transform: translateX(1%) } }
  @keyframes pqMountainDriftC { 0%,100% { transform: translateX(0) } 50% { transform: translateX(-0.5%) } }
  @keyframes pqSunGlow { 0%,100% { opacity: 0.55; transform: scale(1) } 50% { opacity: 0.85; transform: scale(1.04) } }
  @keyframes pqTopoDrift { 0% { background-position: 0 0 } 100% { background-position: 420px 200px } }
  @keyframes pqScrollHint { 0%,100% { transform: translateX(-50%) translateY(0); opacity: 0.7 } 50% { transform: translateX(-50%) translateY(6px); opacity: 1 } }
  @keyframes pqFloat { 0%,100% { transform: translateY(0) rotate(var(--pq-r, 0deg)) } 50% { transform: translateY(-6px) rotate(var(--pq-r, 0deg)) } }
  @keyframes pqCloud { 0% { transform: translateX(-10%) } 100% { transform: translateX(110%) } }
  .pq-left-col::-webkit-scrollbar { display: none }
`;

// ── Static data ───────────────────────────────────────────────────────────────

const STARS: [number, number, number, number][] = [
  [80,80,0.8,0],[160,60,0.7,0.5],[240,120,0.6,1.1],[320,80,0.85,1.8],[440,100,0.75,0.3],
  [520,140,0.6,2.2],[120,180,0.65,1.5],[280,180,0.7,0.8],[380,200,0.55,2.6],[480,180,0.7,1.3],
  [80,220,0.6,0.9],[200,260,0.65,2.1],[60,140,0.55,3.2],
];

const FEATURES = [
  { icon: Map,     title: "Every visit, mapped",  desc: "Tap a park, mark it visited. Watch your trail across the U.S. fill in over years." },
  { icon: Pencil,  title: "Journal as you go",    desc: "Notes, photos, companions, dates. Private by default — share what you want." },
  { icon: Award,   title: "Earn the patches",     desc: "18 badges across five tiers. Sunrise visits, winter trips, the legendary Sixty-Three." },
  { icon: Compass, title: "Plan the next trip",   desc: "Itineraries on the map. Invite friends. Weather forecasts baked in." },
];

const SCREENS = [
  { title: "The Passport", subtitle: "Every visit, stamped", pal: ["#1F3D2E","#3F5949","#152A20"], rotate: "-3deg", delay: "0s",   mt: 0  },
  { title: "The Map",      subtitle: "63 parks, your pace",  pal: ["#2D4F66","#7B9CA8","#1A3548"], rotate: "1.5deg",delay: "1.5s", mt: 28 },
  { title: "Badges",       subtitle: "Five tiers of glory",  pal: ["#7B3A1F","#D89A3A","#582410"], rotate: "-1deg", delay: "3s",   mt: 0  },
];

// ── Sections ──────────────────────────────────────────────────────────────────

function HeroSection({ onScroll }: { onScroll: () => void }) {
  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Animated topo overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: topoPattern("#FFFBF1", 0.16),
          backgroundSize: "420px 420px",
          animation: "pqTopoDrift 90s linear infinite",
        }}
      />

      {/* Sun glow */}
      <div
        style={{
          position: "absolute",
          right: "14%",
          top: "22%",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #D89A3A 0%, rgba(216,154,58,0.53) 30%, transparent 70%)",
          filter: "blur(8px)",
          animation: "pqSunGlow 8s ease-in-out infinite",
        }}
      />

      {/* Drifting cloud */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: 0,
          right: 0,
          height: 30,
          opacity: 0.18,
          pointerEvents: "none",
        }}
      >
        <svg
          viewBox="0 0 200 30"
          preserveAspectRatio="none"
          style={{ width: "40%", height: "100%", animation: "pqCloud 60s linear infinite" }}
        >
          <ellipse cx="40" cy="15" rx="32" ry="8" fill="#FFFBF1" />
          <ellipse cx="80" cy="14" rx="38" ry="9" fill="#FFFBF1" />
          <ellipse cx="125" cy="16" rx="28" ry="7" fill="#FFFBF1" />
        </svg>
      </div>

      {/* Mountains — 3 parallax layers */}
      <svg
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          animation: "pqMountainDriftC 24s ease-in-out infinite",
        }}
      >
        <g
          style={{
            animation: "pqMountainDriftA 18s ease-in-out infinite",
            transformOrigin: "center",
          }}
        >
          <path
            d="M0 800 L0 540 L80 430 L160 500 L240 340 L320 440 L400 300 L480 420 L560 360 L600 390 L600 800 Z"
            fill="rgba(0,0,0,0.20)"
          />
        </g>
        <g
          style={{
            animation: "pqMountainDriftB 22s ease-in-out infinite",
            transformOrigin: "center",
          }}
        >
          <path
            d="M0 800 L0 620 L100 540 L200 580 L280 500 L380 560 L460 500 L560 560 L600 540 L600 800 Z"
            fill="rgba(0,0,0,0.34)"
          />
        </g>
        <path
          d="M0 800 L0 700 L120 660 L240 680 L360 650 L480 680 L600 660 L600 800 Z"
          fill="rgba(0,0,0,0.48)"
        />
      </svg>

      {/* Stars */}
      {STARS.map(([x, y, o, delay], i) => (
        <div
          key={i}
          style={
            {
              position: "absolute",
              top: y,
              left: x,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: "50%",
              background: "#FFFBF1",
              opacity: o,
              animation: `pqStarTwinkle ${3 + (i % 5)}s ${delay}s ease-in-out infinite`,
              "--o": o,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Wordmark */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 40,
          color: "#FFFBF1",
          zIndex: 2,
          fontSize: 17,
          fontWeight: 700,
        }}
      >
        Park<strong style={{ fontWeight: 900 }}>Quest</strong>
      </div>

      {/* Tagline */}
      <div
        style={{ position: "relative", padding: "0 40px 100px", color: "#FFFBF1", zIndex: 2 }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "3px",
            opacity: 0.75,
            textTransform: "uppercase",
          }}
        >
          EST. 2026 · 63 PARKS · ONE QUEST
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 64,
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
          Log every U.S. national park you&apos;ve visited, plan the next one,
          collect stamps and badges, and bring your friends along.
        </div>
      </div>

      {/* Scroll-down indicator */}
      <button
        onClick={onScroll}
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          color: "#FFFBF1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 3,
          animation: "pqScrollHint 2.2s ease-in-out infinite",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "2.4px",
            fontWeight: 600,
            opacity: 0.85,
          }}
        >
          LEARN MORE
        </div>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="10" fill="none" stroke="#FFFBF1" strokeWidth="1" opacity="0.4" />
          <path
            d="M7 9 L 11 14 L 15 9"
            stroke="#FFFBF1"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function AboutSection() {
  return (
    <div
      style={{
        padding: "80px 60px",
        background: "rgba(255,251,241,0.04)",
        borderTop: "0.5px solid rgba(255,251,241,0.10)",
      }}
    >
      <div style={{ maxWidth: 540 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "2.2px",
            color: "rgba(255,251,241,0.65)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          ABOUT · WRITTEN BY THE FOUNDER
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 38,
            color: "#FFFBF1",
            letterSpacing: -1,
            lineHeight: 1.05,
            marginTop: 14,
          }}
        >
          Why I built<br />ParkQuest.
        </div>
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,251,241,0.78)",
            lineHeight: 1.65,
            marginTop: 22,
          }}
        >
          <p style={{ margin: 0, marginBottom: 14 }}>
            I started keeping a notebook in 2019 — date, park, who I was with, three sentences
            about what I saw. By the time I&apos;d visited a dozen parks I had a stack of
            receipts and trail maps stuffed into the back cover. I wanted something better.
          </p>
          <p style={{ margin: 0, marginBottom: 14 }}>
            ParkQuest is the journal I wished existed. Every park you visit becomes a stamp.
            Every milestone earns a badge. Your friends see your wins. Your future trips live
            on the same map as your past ones.
          </p>
          <p style={{ margin: 0 }}>
            It&apos;s free, ad-free, and your data stays yours. Welcome.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#2F7A4A",
              border: "2px solid #152A20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              color: "#FFFBF1",
              flexShrink: 0,
            }}
          >
            D
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#FFFBF1" }}>Dan Glorioso</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "rgba(255,251,241,0.65)",
                letterSpacing: "0.8px",
                marginTop: 1,
                fontWeight: 600,
              }}
            >
              FOUNDER
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div
      style={{
        padding: "80px 60px",
        background: "rgba(0,0,0,0.18)",
        borderTop: "0.5px solid rgba(255,251,241,0.10)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "2.2px",
          color: "rgba(255,251,241,0.65)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        WHAT&apos;S INSIDE
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 38,
          color: "#FFFBF1",
          letterSpacing: -1,
          lineHeight: 1.05,
          marginTop: 14,
          maxWidth: 480,
        }}
      >
        Built for explorers,<br />not couch-loggers.
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 32 }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={i}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,251,241,0.10)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,251,241,0.06)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
            style={{
              background: "rgba(255,251,241,0.06)",
              border: "0.5px solid rgba(255,251,241,0.14)",
              borderRadius: 14,
              padding: "22px 22px 24px",
              transition: "transform 220ms cubic-bezier(.2,.7,.3,1), background 220ms",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#D89A3A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(216,154,58,0.40)",
              }}
            >
              <f.icon size={22} strokeWidth={1.8} color="#FFFBF1" />
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: "#FFFBF1",
                marginTop: 14,
                letterSpacing: -0.2,
              }}
            >
              {f.title}
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "rgba(255,251,241,0.72)",
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenPreview({
  title,
  subtitle,
  pal,
  rotate,
  delay,
}: {
  title: string;
  subtitle: string;
  pal: string[];
  rotate: string;
  delay: string;
}) {
  return (
    <div
      style={
        {
          flex: 1,
          background: "#FFFBF1",
          borderRadius: 14,
          overflow: "hidden",
          border: "0.5px solid rgba(58,46,28,0.15)",
          boxShadow: "0 12px 32px rgba(58,42,18,0.18)",
          animation: `pqFloat 6s ease-in-out infinite ${delay}`,
          "--pq-r": rotate,
        } as React.CSSProperties
      }
    >
      {/* Window chrome */}
      <div
        style={{
          height: 22,
          background: "#F2EBDB",
          borderBottom: "0.5px solid rgba(58,46,28,0.12)",
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          gap: 5,
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff736a" }} />
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#19c332" }} />
      </div>
      {/* Body */}
      <div
        style={{
          height: 200,
          position: "relative",
          background: `linear-gradient(160deg, ${pal[0]}, ${pal[1]} 60%, ${pal[2]})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: topoPattern("#FFFBF1", 0.10),
            backgroundSize: "180px 180px",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            right: 14,
            color: "#FFFBF1",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              letterSpacing: "1.4px",
              opacity: 0.7,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            SCREEN PREVIEW
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3, marginTop: 2 }}>
            {title}
          </div>
          <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 1 }}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function ScreenshotsSection() {
  return (
    <div
      style={{
        padding: "80px 60px",
        background: "#FAF3E0",
        position: "relative",
        overflow: "hidden",
        borderTop: "0.5px solid rgba(255,251,241,0.10)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: topoPattern("#3A2E1C", 0.06),
          backgroundSize: "260px 260px",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "2.2px",
            color: "rgba(58,46,28,0.55)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          A LOOK INSIDE
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 38,
            color: "#3A2E1C",
            letterSpacing: -1,
            lineHeight: 1.05,
            marginTop: 14,
            maxWidth: 480,
          }}
        >
          Premium feel.<br />Outdoor soul.
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 36, paddingBottom: 10 }}>
          {SCREENS.map((s, i) => (
            <div key={i} style={{ flex: 1, marginTop: s.mt }}>
              <ScreenPreview {...s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialProofSection() {
  const avatarColors = ["#2F7A4A", "#D89A3A", "#2D4F66", "#8B5DBF", "#C56B3D"];
  return (
    <div
      style={{
        padding: "80px 60px",
        background: "rgba(0,0,0,0.30)",
        borderTop: "0.5px solid rgba(255,251,241,0.10)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex" }}>
          {avatarColors.map((color, i) => (
            <div
              key={i}
              style={{
                marginLeft: i === 0 ? 0 : -12,
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: color,
                border: "2px solid #152A20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 15,
                color: "#FFFBF1",
                flexShrink: 0,
              }}
            >
              {["M", "J", "S", "R", "N"][i]}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontWeight: 800, fontSize: 28, color: "#FFFBF1", letterSpacing: -0.6 }}
          >
            24,318 explorers
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "rgba(255,251,241,0.7)",
              letterSpacing: "0.8px",
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            148,290 STAMPS · 1,842 BADGES EARNED THIS MONTH
          </div>
        </div>
      </div>

      <div style={{ marginTop: 50, maxWidth: 620 }}>
        <div
          style={{
            fontStyle: "italic",
            fontSize: 24,
            color: "#FFFBF1",
            letterSpacing: -0.3,
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          &ldquo;The first app I&apos;ve used that actually feels designed for being outside,
          not for staring at my phone in line at REI.&rdquo;
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#2F7A4A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 12,
              color: "#FFFBF1",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#FFFBF1" }}>Maya Okafor</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "rgba(255,251,241,0.6)",
                letterSpacing: "0.6px",
                marginTop: 1,
                fontWeight: 600,
              }}
            >
              23 PARKS · PORTLAND, OR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalCTASection() {
  return (
    <div
      style={{
        padding: "80px 60px 100px",
        background: "linear-gradient(180deg, #1F3D2E 0%, #152A20 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: topoPattern("#FFFBF1", 0.10),
          backgroundSize: "300px 300px",
          animation: "pqTopoDrift 60s linear infinite",
        }}
      />
      <div
        style={{
          position: "relative",
          textAlign: "center",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "2.2px",
            color: "rgba(255,251,241,0.65)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          READY?
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 44,
            color: "#FFFBF1",
            letterSpacing: -1.2,
            lineHeight: 1.0,
            marginTop: 14,
          }}
        >
          63 parks.<br />One quest.<br />Yours.
        </div>
        <div
          style={{
            fontSize: 15,
            color: "rgba(255,251,241,0.78)",
            lineHeight: 1.55,
            marginTop: 18,
          }}
        >
          Create an account on the right →<br />or sign in if you&apos;ve already started.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 22,
            marginTop: 50,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "1.2px",
            color: "rgba(255,251,241,0.55)",
            fontWeight: 600,
          }}
        >
          {["ABOUT", "PRIVACY", "TERMS", "CONTACT", "CHANGELOG"].map((l) => (
            <span key={l} style={{ cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            letterSpacing: "1px",
            color: "rgba(255,251,241,0.35)",
            fontWeight: 600,
          }}
        >
          © PARKQUEST · MADE FOR EVERY PARK
        </div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface AuthHeroLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthHeroLayout({ title, subtitle, children }: AuthHeroLayoutProps) {
  const leftRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    if (leftRef.current) {
      leftRef.current.scrollTo({ top: leftRef.current.clientHeight, behavior: "smooth" });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <style>{ANIMATIONS}</style>

      {/* Left — scrollable marketing column */}
      <div
        ref={leftRef}
        className="pq-left-col"
        style={{
          flex: "1.2",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          background: "linear-gradient(180deg, #152A20 0%, #1F3D2E 50%, #152A20 100%)",
        }}
      >
        <HeroSection onScroll={scrollDown} />
        <AboutSection />
        <FeaturesSection />
        <ScreenshotsSection />
        <SocialProofSection />
        <FinalCTASection />
      </div>

      {/* Right — sticky sign-in/sign-up form */}
      <div
        style={{
          width: 480,
          flexShrink: 0,
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "var(--bg)",
          borderLeft: "0.5px solid var(--hairline)",
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
          <a
            href="#"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="#"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
