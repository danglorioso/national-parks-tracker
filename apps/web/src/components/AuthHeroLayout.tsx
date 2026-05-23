"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { Map, Pencil, Award, Compass, ArrowRight } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function topoPattern(color: string, opacity: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'><g fill='none' stroke='${color}' stroke-opacity='${opacity}' stroke-width='1'><path d='M-20 60 Q 60 30 130 60 T 280 60 T 440 60'/><path d='M-20 110 Q 60 80 130 110 T 280 110 T 440 110'/><path d='M-20 160 Q 60 130 130 160 T 280 160 T 440 160'/><path d='M-20 210 Q 60 180 130 210 T 280 210 T 440 210'/><path d='M-20 260 Q 60 230 130 260 T 280 260 T 440 260'/><path d='M-20 310 Q 60 280 130 310 T 280 310 T 440 310'/><path d='M-20 360 Q 60 330 130 360 T 280 360 T 440 360'/><path d='M-20 410 Q 60 380 130 410 T 280 410 T 440 410'/></g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const ANIMATIONS = `
  @keyframes pqStarTwinkle    { 0%,100% { opacity: var(--o,0.7) } 50% { opacity: calc(var(--o,0.7) * 0.35) } }
  @keyframes pqMountainDriftA { 0%,100% { transform: translateX(0) translateY(0) } 50% { transform: translateX(-1.2%) translateY(0.3%) } }
  @keyframes pqMountainDriftB { 0%,100% { transform: translateX(0) } 50% { transform: translateX(1%) } }
  @keyframes pqMountainDriftC { 0%,100% { transform: translateX(0) } 50% { transform: translateX(-0.5%) } }
  @keyframes pqSunGlow        { 0%,100% { opacity: 0.55; transform: scale(1) } 50% { opacity: 0.85; transform: scale(1.04) } }
  @keyframes pqTopoDrift      { 0% { background-position: 0 0 } 100% { background-position: 420px 200px } }
  @keyframes pqScrollHint     { 0%,100% { transform: translateX(-50%) translateY(0); opacity: 0.7 } 50% { transform: translateX(-50%) translateY(6px); opacity: 1 } }
  @keyframes pqFloat          { 0%,100% { transform: translateY(0) rotate(var(--pq-r,0deg)) } 50% { transform: translateY(-6px) rotate(var(--pq-r,0deg)) } }
  @keyframes pqCloud          { 0% { transform: translateX(-100%) } 100% { transform: translateX(250%) } }
  @keyframes pqShootingStar   {
    0%,10%  { transform: translateX(0) translateY(0) rotate(-42deg); opacity: 0; }
    12%     { opacity: 1; }
    24%     { transform: translateX(-320px) translateY(320px) rotate(-42deg); opacity: 0; }
    100%    { transform: translateX(-320px) translateY(320px) rotate(-42deg); opacity: 0; }
  }
  .pq-left-col::-webkit-scrollbar { display: none }
  @media (prefers-reduced-motion: reduce) {
    .pq-left-col *, .pq-left-col *::before, .pq-left-col *::after {
      animation: none !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ── Static data ───────────────────────────────────────────────────────────────

const STARS: [number, number, number, number][] = [
  [80,80,0.8,0],[160,60,0.7,0.5],[240,120,0.6,1.1],[320,80,0.85,1.8],[440,100,0.75,0.3],
  [520,140,0.6,2.2],[120,180,0.65,1.5],[280,180,0.7,0.8],[380,200,0.55,2.6],[480,180,0.7,1.3],
  [80,220,0.6,0.9],[200,260,0.65,2.1],[60,140,0.55,3.2],[600,90,0.7,1.0],[700,170,0.6,0.4],
];

const SHOOTING_STARS: Array<{ right: string; top: number; width: number; delay: number; duration: number }> = [
  { right: "28%", top: 55,  width: 90,  delay: 0,  duration: 22 },
  { right: "14%", top: 35,  width: 70,  delay: 9,  duration: 28 },
  { right: "42%", top: 75,  width: 100, delay: 18, duration: 24 },
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

// ── Form components ──────────────────────────────────────────────────────────

function UsernameStep() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleChange = (v: string) =>
    setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isLoaded || !user || username.length < 3) return;
    setError(null);
    setBusy(true);
    try {
      await user.update({ username });
      localStorage.setItem("pq_returning", "1");
      router.push("/map");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      setError(
        clerkErr?.errors?.[0]?.longMessage ??
        clerkErr?.errors?.[0]?.message ??
        "Username taken or invalid. Try another."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DField label="Username" value={username} onChange={handleChange} />
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          color: "var(--ink-mute)",
          letterSpacing: "0.6px",
          marginBottom: 14,
          marginTop: -4,
        }}
      >
        Lowercase letters, numbers, and underscores only · 3 chars min
      </div>

      {error && (
        <div
          style={{
            background: "rgba(197,107,61,0.10)",
            border: "0.5px solid rgba(197,107,61,0.30)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12.5,
            color: "var(--accent)",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || username.length < 3}
        style={{
          width: "100%",
          background: "var(--primary)",
          color: "#FFFBF1",
          border: "none",
          borderRadius: 12,
          padding: "14px 0",
          fontSize: 14,
          fontWeight: 700,
          cursor: busy || username.length < 3 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 8px 22px rgba(31,61,46,0.30)",
          opacity: busy || username.length < 3 ? 0.6 : 1,
        }}
      >
        Enter ParkQuest
        <ArrowRight style={{ width: 16, height: 16 }} strokeWidth={2.4} />
      </button>
    </form>
  );
}

function DField({
  label,
  type = "text",
  value,
  onChange,
  trailing,
  onTrailingClick,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: string;
  onTrailingClick?: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--hairline)",
        borderRadius: 12,
        padding: "10px 14px",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "1.4px",
            color: "var(--ink-mute)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: 0,
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            fontSize: 15,
            color: "var(--ink)",
            width: "100%",
            padding: "2px 0",
            marginTop: 2,
          }}
        />
      </div>
      {trailing && (
        <button
          type="button"
          onClick={onTrailingClick}
          style={{
            background: "transparent",
            border: 0,
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-mute)",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        >
          {trailing}
        </button>
      )}
    </div>
  );
}

function AppleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 256 262" fill="none">
      <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
      <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
      <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
      <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
    </svg>
  );
}

function AuthForm({ mode, onSignUpComplete }: { mode: "signin" | "signup"; onSignUpComplete: () => void }) {
  const router = useRouter();
  const { signIn, setActive: setSIActive, isLoaded: siLoaded } = useSignIn();
  const { signUp, setActive: setSUActive, isLoaded: suLoaded } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLoaded = mode === "signin" ? siLoaded : suLoaded;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const result = await signIn!.create({ identifier: email, password });
        if (result.status === "complete") {
          await setSIActive!({ session: result.createdSessionId });
          localStorage.setItem("pq_returning", "1");
          router.push("/map");
        }
      } else {
        const result = await signUp!.create({ emailAddress: email, password });
        if (result.status === "complete") {
          await setSUActive!({ session: result.createdSessionId });
          onSignUpComplete();
        }
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      const msg =
        clerkErr?.errors?.[0]?.longMessage ??
        clerkErr?.errors?.[0]?.message ??
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async (strategy: "oauth_apple" | "oauth_google") => {
    if (!siLoaded) return;
    try {
      await signIn!.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/onboarding/username",
      });
    } catch {
      setError("OAuth sign-in failed. Please try again.");
    }
  };

  const socialBtnStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "var(--surface)",
    border: "0.5px solid var(--hairline)",
    borderRadius: 12,
    padding: "13px 0",
    fontWeight: 600,
    fontSize: 13,
    color: "var(--ink)",
    cursor: "pointer",
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button type="button" onClick={() => handleOAuth("oauth_apple")} style={socialBtnStyle}>
          <AppleGlyph />
          Apple
        </button>
        <button type="button" onClick={() => handleOAuth("oauth_google")} style={socialBtnStyle}>
          <GoogleGlyph />
          Google
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, height: "0.5px", background: "var(--hairline)" }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "1.5px",
            color: "var(--ink-mute)",
            fontWeight: 600,
          }}
        >
          OR
        </span>
        <div style={{ flex: 1, height: "0.5px", background: "var(--hairline)" }} />
      </div>

      <DField label="Email" type="email" value={email} onChange={setEmail} />
      <DField
        label="Password"
        type={showPw ? "text" : "password"}
        value={password}
        onChange={setPassword}
        trailing={showPw ? "Hide" : "Show"}
        onTrailingClick={() => setShowPw((v) => !v)}
      />

      {mode === "signin" && (
        <div style={{ textAlign: "right", marginBottom: 14 }}>
          <a
            href="/forgot-password"
            style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-mute)"; }}
          >
            Forgot password?
          </a>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "rgba(197,107,61,0.10)",
            border: "0.5px solid rgba(197,107,61,0.30)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12.5,
            color: "var(--accent)",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        style={{
          width: "100%",
          background: "var(--primary)",
          color: "#FFFBF1",
          border: "none",
          borderRadius: 12,
          padding: "14px 0",
          fontSize: 14,
          fontWeight: 700,
          cursor: busy ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 8px 22px rgba(31,61,46,0.30)",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {mode === "signin" ? "Sign In" : "Create Account"}
        <ArrowRight style={{ width: 16, height: 16 }} strokeWidth={2.4} />
      </button>
    </form>
  );
}

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
          background: "radial-gradient(circle, var(--accent-2) 0%, rgba(216,154,58,0.53) 30%, transparent 70%)",
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

      {/* 15 stars */}
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

      {/* Shooting stars */}
      {SHOOTING_STARS.map((s, i) => (
        <div
          key={`ss-${i}`}
          style={{
            position: "absolute",
            top: s.top,
            right: s.right,
            width: s.width,
            height: 1.5,
            borderRadius: 2,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,251,241,0.9) 70%, #FFFBF1 100%)",
            animation: `pqShootingStar ${s.duration}s ${s.delay}s ease-out infinite`,
            pointerEvents: "none",
          }}
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
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 20L9 9l3 5 3-7 6 13H3z" />
          <circle cx="17" cy="6" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.4 }}>
          Park<span style={{ fontWeight: 500 }}>Quest</span>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ position: "relative", padding: "0 40px 100px", color: "#FFFBF1", zIndex: 2 }}>
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
            lineHeight: 1,
            marginTop: 18,
          }}
        >
          Every park.<br />One journal.<br />
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

      {/* Animated scroll-down indicator */}
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
      id="about"
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
          ABOUT
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
            I grew up taking family vacations roadtripping around the country to different
            national parks every summer. Through these trips, I gained a deep appreciation for
            the natural beauty and massive diversity within our national parks.
          </p>
          <p style={{ margin: 0, marginBottom: 14 }}>
            Over the years, I&apos;ve really enjoyed hiking and exploring more national parks.
            Each park really has its own unique charm and fascinating story, and I love how
            the national parks have allowed me to discover natural beauties that lie within the US.
          </p>
          <p style={{ margin: 0, marginBottom: 14 }}>
            That&apos;s why I created this app — to keep track of where you&apos;ve been and
            to help other adventurers who, like me, enjoy experiencing new regions of the country.
            Whether you&apos;re planning an upcoming park visit or working toward checking all 63
            national parks off your list, I&apos;ve designed this app to help you document your
            journeys and share your experiences with others.
          </p>
          <p style={{ margin: 0 }}>
            I hope this app motivates you to visit even more of these incredible places.
            Happy exploring!
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--visited)",
              border: "2px solid var(--primary-deep)",
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
        Built for explorers,<br /> and everyone else.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 32 }}>
        {FEATURES.map((f, i) => (
          <div
            key={i}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,251,241,0.10)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,251,241,0.06)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
            style={{
              background: "rgba(255,251,241,0.06)",
              border: "0.5px solid rgba(255,251,241,0.14)",
              borderRadius: 14,
              padding: "22px 22px 24px",
              transition: "transform 220ms cubic-bezier(.2,.7,.3,1), background 220ms",
              cursor: "default",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--accent-2)",
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
          style={{ position: "absolute", bottom: 14, left: 14, right: 14, color: "#FFFBF1" }}
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
                marginLeft: i === 0 ? 0 : -10,
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: color,
                border: "2px solid var(--primary-deep)",
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
          <div style={{ fontWeight: 800, fontSize: 28, color: "#FFFBF1", letterSpacing: -0.6 }}>
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
            148,290 STAMPS · 1,842 BADGES EARNED THIS MONTH · 12 NEW PARKS LOGGED TODAY
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
              background: "var(--visited)",
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

function FinalCTASection({ onAbout }: { onAbout: () => void }) {
  return (
    <div
      style={{
        padding: "80px 60px 100px",
        background: "linear-gradient(180deg, var(--primary) 0%, var(--primary-deep) 100%)",
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
          63 parks.<br />One quest.<br />
        </div>
        <div
          style={{
            fontSize: 15,
            color: "rgba(255,251,241,0.78)",
            lineHeight: 1.55,
            marginTop: 18,
          }}
        >
          Scroll up to sign in or create an account.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 22,
            marginTop: 50,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "1.2px",
            color: "rgba(255,251,241,0.55)",
            fontWeight: 600,
          }}
        >
          <button
            onClick={onAbout}
            style={{
              background: "transparent",
              border: 0,
              color: "rgba(255,251,241,0.55)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "1.2px",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ABOUT
          </button>
          {["PRIVACY", "TERMS", "CONTACT", "CHANGELOG"].map((l) => (
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
  children?: React.ReactNode;
  forcedMode?: "username";
}

export function AuthHeroLayout({ children, forcedMode }: AuthHeroLayoutProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "username">(
    () => forcedMode ?? (localStorage.getItem("pq_returning") ? "signin" : "signup")
  );

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
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
          background: "linear-gradient(180deg, var(--primary-deep) 0%, var(--primary) 50%, var(--primary-deep) 100%)",
        }}
      >
        <HeroSection onScroll={scrollToAbout} />
        <AboutSection />
        <FeaturesSection />
        <ScreenshotsSection />
        <SocialProofSection />
        <FinalCTASection onAbout={scrollToAbout} />
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
        {/* Kicker */}
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
          DIGITAL NATIONAL PARK JOURNAL
        </div>

        {/* Headline + sub */}
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
          {mode === "signin" ? "Welcome back." : mode === "signup" ? "Start your quest." : "One last thing."}
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-mute)", marginTop: 6 }}>
          {mode === "signin"
            ? "Pick up where you left off."
            : mode === "signup"
            ? "Free, ad-free, your data stays yours."
            : "Choose a username for your explorer profile."}
        </div>

        {/* Tab switcher — hidden during username step */}
        {mode !== "username" && (
          <div
            style={{
              display: "flex",
              background: "var(--surface-alt)",
              borderRadius: 12,
              padding: 4,
              marginTop: 24,
              gap: 4,
            }}
          >
            {(["signin", "signup"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? "var(--surface)" : "transparent",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    color: active ? "var(--ink)" : "var(--ink-mute)",
                    fontWeight: 700,
                    fontSize: 13,
                    transition: "background 150ms, color 150ms",
                  }}
                >
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              );
            })}
          </div>
        )}

        {/* Form area */}
        <div style={{ marginTop: 18 }}>
          {mode === "username" ? (
            <UsernameStep />
          ) : (
            <AuthForm mode={mode} onSignUpComplete={() => setMode("username")} />
          )}
        </div>

        {/* Terms footer — hidden during username step */}
        {mode !== "username" && (
          <div
            style={{
              marginTop: 28,
              fontSize: 11.5,
              color: "var(--ink-mute)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            By continuing you agree to the{" "}
            <a href="#" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Terms
            </a>{" "}
            and{" "}
            <a href="#" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Privacy Policy
            </a>
            .
          </div>
        )}

        {/* Hidden slot for Clerk SSO callback processing */}
        <div aria-hidden style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
