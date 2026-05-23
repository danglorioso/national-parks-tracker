"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DesktopShell } from "@/components/desktop/DesktopShell";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Park {
  park_code: string;
  name: string;
  states: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface Visit {
  park_code: string;
  is_bucket_list: boolean;
  visited_date: string | null;
}

type StatusFilter = "all" | "visited" | "bucketList" | "notVisited";

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADIENTS = [
  ["#1F3D2E", "#2F7A4A", "#C56B3D"],
  ["#2D4F66", "#1F3D2E", "#D89A3A"],
  ["#7B3A1F", "#C56B3D", "#1F3D2E"],
  ["#3A2E5C", "#6E97A3", "#D89A3A"],
  ["#2F7A4A", "#1F3D2E", "#2D4F66"],
];

function parkGradient(code: string) {
  const idx = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  const [a, b, c] = GRADIENTS[idx];
  return `linear-gradient(160deg, ${a} 0%, ${b} 55%, ${c} 130%)`;
}

function parkStatus(code: string, visits: Visit[]): "visited" | "bucketList" | "notVisited" {
  const parkVisits = visits.filter((v) => v.park_code === code);
  if (parkVisits.some((v) => !v.is_bucket_list && v.visited_date)) return "visited";
  if (parkVisits.some((v) => v.is_bucket_list)) return "bucketList";
  return "notVisited";
}

const STATUS_LABEL: Record<string, string> = {
  visited: "Visited",
  bucketList: "Bucket list",
  notVisited: "",
};

const STATUS_COLOR: Record<string, string> = {
  visited: "#2F7A4A",
  bucketList: "#D89A3A",
  notVisited: "",
};

// ── ParkCard ──────────────────────────────────────────────────────────────────

function ParkCard({ park, status }: { park: Park; status: "visited" | "bucketList" | "notVisited" }) {
  const gradient = parkGradient(park.park_code);
  const state = park.states.split(",")[0]?.trim() ?? park.states;

  return (
    <Link href={`/parks/${park.park_code}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "var(--surface)",
          border: "0.5px solid var(--hairline)",
          borderRadius: 14,
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Color band */}
        <div style={{ height: 80, background: gradient, position: "relative" }}>
          {status !== "notVisited" && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.38)",
                backdropFilter: "blur(6px)",
                border: `0.5px solid ${STATUS_COLOR[status]}60`,
                borderRadius: 100,
                padding: "3px 9px",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[status], flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: STATUS_COLOR[status], letterSpacing: "0.6px" }}>
                {STATUS_LABEL[status]}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "12px 14px 14px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 700,
              color: "var(--ink-mute)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {state}
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "var(--ink)",
              lineHeight: 1.2,
              letterSpacing: -0.2,
            }}
          >
            {park.name}
          </div>
          {park.description && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-mute)",
                marginTop: 6,
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {park.description}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ParksPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [parks, setParks] = useState<Park[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    Promise.all([
      fetch("/api/parks").then((r) => r.ok ? r.json() : []),
      fetch("/api/visits").then((r) => r.ok ? r.json() : []),
    ]).then(([p, v]) => {
      setParks(p);
      setVisits(v);
    });
  }, [isSignedIn]);

  const states = useMemo(() => {
    const set = new Set<string>();
    parks.forEach((p) => p.states.split(",").forEach((s) => set.add(s.trim())));
    return Array.from(set).sort();
  }, [parks]);

  const filtered = useMemo(() => {
    return parks.filter((p) => {
      const status = parkStatus(p.park_code, visits);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (stateFilter !== "all" && !p.states.split(",").map((s) => s.trim()).includes(stateFilter)) return false;
      if (query) {
        const q = query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.states.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [parks, visits, query, statusFilter, stateFilter]);

  const visitedCount = useMemo(() => parks.filter((p) => parkStatus(p.park_code, visits) === "visited").length, [parks, visits]);

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    borderRadius: 100,
    border: active ? "0.5px solid var(--primary)" : "0.5px solid var(--hairline)",
    background: active ? "var(--primary)" : "var(--surface)",
    color: active ? "#FFFBF1" : "var(--ink)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <DesktopShell>
      <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1.6px", color: "var(--ink-mute)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            All Parks
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 34, color: "var(--ink)", letterSpacing: -1 }}>
              63 Parks
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-mute)", fontWeight: 600 }}>
              {visitedCount} / {parks.length} visited
            </div>
          </div>
        </div>

        {/* Search + filter bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--surface)",
              border: "0.5px solid var(--hairline)",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <Search size={15} style={{ color: "var(--ink-mute)", flexShrink: 0 }} strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search parks…"
              style={{
                flex: 1,
                border: 0,
                outline: "none",
                background: "transparent",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-mute)", display: "flex", padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: showFilters ? "var(--primary)" : "var(--surface)",
              color: showFilters ? "#FFFBF1" : "var(--ink)",
              border: showFilters ? "0.5px solid var(--primary)" : "0.5px solid var(--hairline)",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
            Filter
          </button>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["all", "visited", "bucketList", "notVisited"] as StatusFilter[]).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} style={chipStyle(statusFilter === s)}>
                  {s === "all" ? "All" : s === "visited" ? "Visited" : s === "bucketList" ? "Bucket list" : "Not visited"}
                </button>
              ))}
            </div>
            <div style={{ width: "0.5px", background: "var(--hairline)", margin: "0 4px" }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setStateFilter("all")} style={chipStyle(stateFilter === "all")}>All states</button>
              {states.map((s) => (
                <button key={s} onClick={() => setStateFilter(s)} style={chipStyle(stateFilter === s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        {(query || statusFilter !== "all" || stateFilter !== "all") && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-mute)", letterSpacing: "1px", marginBottom: 16, fontWeight: 600 }}>
            {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((park) => (
              <ParkCard key={park.park_code} park={park} status={parkStatus(park.park_code, visits)} />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "var(--ink-mute)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏔</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 6 }}>No parks found</div>
            <div style={{ fontSize: 13 }}>Try adjusting your search or filters.</div>
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
