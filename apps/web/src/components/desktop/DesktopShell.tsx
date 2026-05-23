"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home, Sparkles, Map, User, Award, Compass,
  Check, Bookmark, PenLine, Users, Globe,
  Plus, ChevronDown, Mountain,
} from "lucide-react";

// ── Wordmark ─────────────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <Mountain className="w-5 h-5 shrink-0" strokeWidth={1.8} style={{ color: "var(--primary)" }} />
      <span className="text-base leading-none" style={{ color: "var(--primary)" }}>
        Park<strong className="font-extrabold">Quest</strong>
      </span>
    </div>
  );
}

// ── Nav config ───────────────────────────────────────────────────────────────

const NAV = [
  {
    group: "PRIMARY",
    items: [
      { id: "dashboard", href: "/dashboard", icon: Home,    label: "Home" },
      { id: "feed",      href: "/feed",      icon: Sparkles, label: "Feed" },
      { id: "map",       href: "/map",       icon: Map,     label: "Map" },
      { id: "passport",  href: "/passport",  icon: User,    label: "Passport" },
      { id: "badges",    href: "/badges",    icon: Award,   label: "Badges" },
      { id: "planner",   href: "/planner",   icon: Compass, label: "Trip Planner" },
    ],
  },
  {
    group: "COLLECTIONS",
    items: [
      { id: "visited", href: "/visits",  icon: Check,    label: "Visited",    countKey: "visited" as const },
      { id: "bucket",  href: "/bucket",  icon: Bookmark, label: "Bucket list", countKey: "bucket" as const },
      { id: "journal", href: "/journal", icon: PenLine,  label: "Journal" },
    ],
  },
  {
    group: "PEOPLE",
    items: [
      { id: "friends",  href: "/friends",  icon: Users, label: "Friends" },
      { id: "discover", href: "/discover", icon: Globe,  label: "Discover" },
    ],
  },
] as const;

// ── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  visitedCount: number;
  totalCount: number;
  bucketCount: number;
  onLogVisit?: () => void;
}

function DesktopSidebar({ visitedCount, totalCount, bucketCount, onLogVisit }: SidebarProps) {
  const pathname = usePathname();
  const pct = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;

  return (
    <aside
      className="flex flex-col shrink-0 overflow-y-auto"
      style={{
        width: 232,
        background: "#f5efe0",
        borderRight: "0.5px solid var(--hairline)",
        backdropFilter: "blur(30px) saturate(160%)",
        WebkitBackdropFilter: "blur(30px) saturate(160%)",
        padding: "14px 0 12px",
      }}
    >
      {/* Wordmark */}
      <div style={{ padding: "6px 18px 14px" }}>
        <Wordmark />
      </div>

      {/* Log a visit CTA */}
      <div style={{ padding: "0 12px 14px" }}>
        <button
          onClick={onLogVisit}
          className="w-full flex items-center justify-center gap-[7px] font-bold cursor-pointer transition-opacity hover:opacity-90"
          style={{
            background: "var(--primary)",
            color: "#FFFBF1",
            fontSize: 13,
            letterSpacing: 0.1,
            padding: "10px 12px",
            borderRadius: "var(--r-sm)",
            border: "none",
            boxShadow: "0 4px 12px rgba(31,61,46,0.35)",
          }}
        >
          <Plus className="w-[15px] h-[15px] shrink-0" strokeWidth={2.4} />
          Log a visit
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1">
        {NAV.map((group) => (
          <div key={group.group} className="mb-4">
            <div
              className="uppercase font-semibold"
              style={{
                padding: "4px 18px 6px",
                fontSize: 9,
                letterSpacing: "1.6px",
                fontFamily: "var(--font-mono)",
                color: "var(--ink-mute)",
              }}
            >
              {group.group}
            </div>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              const count =
                "countKey" in item && item.countKey === "visited"
                  ? visitedCount
                  : "countKey" in item && item.countKey === "bucket"
                  ? bucketCount
                  : undefined;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative flex items-center gap-[10px] w-full transition-colors"
                  style={{
                    padding: "7px 18px",
                    background: isActive ? "rgba(31,61,46,0.08)" : "transparent",
                    color: isActive ? "var(--primary)" : "var(--ink-soft)",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 rounded-sm"
                      style={{
                        top: 8,
                        bottom: 8,
                        width: 3,
                        background: "var(--primary)",
                      }}
                    />
                  )}
                  <Icon
                    className="w-4 h-4 shrink-0"
                    strokeWidth={isActive ? 2.2 : 1.8}
                    style={{ color: isActive ? "var(--primary)" : "var(--ink-soft)" }}
                  />
                  <span className="flex-1">{item.label}</span>
                  {count != null && (
                    <span
                      className="font-semibold tabular-nums"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--ink-mute)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Quest progress widget */}
      <div
        style={{
          margin: "auto 14px 0",
          padding: "10px 4px 2px",
          borderTop: "0.5px solid var(--hairline-soft)",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span
            className="uppercase font-semibold"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "1.4px",
              color: "var(--ink-mute)",
            }}
          >
            QUEST
          </span>
          <span className="font-bold" style={{ fontSize: 11, color: "var(--ink)" }}>
            {visitedCount} / {totalCount || 63}
          </span>
        </div>
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 6, background: "var(--surface-alt)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(to right, var(--primary), var(--accent))",
            }}
          />
        </div>
        <div style={{ fontSize: 10.5, color: "var(--ink-mute)", marginTop: 4 }}>
          {Math.round(pct)}% complete · {(totalCount || 63) - visitedCount} to go
        </div>
      </div>
    </aside>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

interface DesktopShellProps {
  children: React.ReactNode;
  fullbleed?: boolean;
  rightRail?: React.ReactNode;
  onLogVisit?: () => void;
}

export function DesktopShell({
  children,
  fullbleed = false,
  rightRail,
  onLogVisit,
}: DesktopShellProps) {
  const { user, isLoaded } = useUser();
  const [visitedCount, setVisitedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(63);
  const [bucketCount, setBucketCount] = useState(0);

  useEffect(() => {
    fetch("/api/visits")
      .then((r) => (r.ok ? r.json() : []))
      .then(
        (
          visits: Array<{
            is_bucket_list: boolean;
            visited_date: string | null;
          }>
        ) => {
          setVisitedCount(
            visits.filter((v) => !v.is_bucket_list && v.visited_date).length
          );
          setBucketCount(visits.filter((v) => v.is_bucket_list).length);
        }
      )
      .catch(() => {});

    fetch("/api/parks")
      .then((r) => (r.ok ? r.json() : []))
      .then((parks: unknown[]) => {
        if (parks.length) setTotalCount(parks.length);
      })
      .catch(() => {});
  }, []);

  const firstName = user?.firstName ?? "Explorer";
  const avatarUrl = user?.imageUrl ?? "";

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Title bar */}
      <div
        className="flex items-center shrink-0 justify-end px-3"
        style={{
          height: 36,
          background: "rgba(255,251,241,0.95)",
          borderBottom: "0.5px solid var(--hairline)",
        }}
      >
        {/* Avatar pill */}
        {isLoaded && (
          <div className="ml-auto">
            <div
              className="flex items-center gap-[7px] cursor-pointer"
              style={{
                padding: "3px 9px 3px 3px",
                borderRadius: 100,
                background: "var(--surface)",
                border: "0.5px solid var(--hairline)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={firstName}
                  className="rounded-full object-cover shrink-0"
                  style={{ width: 22, height: 22 }}
                />
              ) : (
                <div
                  className="rounded-full shrink-0"
                  style={{ width: 22, height: 22, background: "var(--surface-alt)" }}
                />
              )}
              <span
                className="font-semibold"
                style={{ fontSize: 11.5, color: "var(--ink)" }}
              >
                {firstName}
              </span>
              <ChevronDown
                className="w-[11px] h-[11px]"
                strokeWidth={2.2}
                style={{ color: "var(--ink-mute)" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <DesktopSidebar
          visitedCount={visitedCount}
          totalCount={totalCount}
          bucketCount={bucketCount}
          onLogVisit={onLogVisit}
        />

        <div className="flex flex-1 min-w-0 min-h-0" style={{ background: "var(--bg)" }}>
          {fullbleed ? (
            <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
          ) : (
            <>
              <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
              {rightRail && (
                <div
                  className="shrink-0 overflow-y-auto"
                  style={{
                    width: 340,
                    borderLeft: "0.5px solid var(--hairline-soft)",
                    background: "var(--bg)",
                  }}
                >
                  {rightRail}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
