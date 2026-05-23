"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, PenLine, MapPin, Plus,
} from "lucide-react";
import { DesktopShell } from "@/components/desktop/DesktopShell";
import { DesktopButton } from "@/components/desktop/DesktopButton";
import VisitDateDialog, { type JournalData } from "@/components/VisitDateDialog";
import EditVisitDialog from "@/components/EditVisitDialog";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParkData {
  park_code: string;
  name: string;
  states: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface VisitData {
  park_code: string;
  visited_date: string | null;
  is_bucket_list: boolean;
  title: string | null;
  notes: string | null;
  photos: string[] | null;
  visibility: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADIENTS = [
  ["#1F3D2E", "#2F7A4A", "#C56B3D"],
  ["#2D4F66", "#1F3D2E", "#D89A3A"],
  ["#7B3A1F", "#C56B3D", "#1F3D2E"],
  ["#3A2E5C", "#6E97A3", "#D89A3A"],
  ["#2F7A4A", "#1F3D2E", "#2D4F66"],
];

function parkGradient(code: string): string {
  const idx = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  const [a, b, c] = GRADIENTS[idx];
  return `linear-gradient(160deg, ${a} 0%, ${b} 55%, ${c} 130%)`;
}

// ── StatusChip ────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: "visited" | "bucketList" | "notVisited" }) {
  const cfg = {
    visited:    { label: "Visited",     bg: "rgba(47,122,74,0.18)",  color: "#2F7A4A" },
    bucketList: { label: "Bucket list", bg: "rgba(216,154,58,0.18)", color: "#D89A3A" },
    notVisited: { label: "Not visited", bg: "rgba(168,162,154,0.22)", color: "#7A746A" },
  }[status];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: cfg.bg,
        padding: "4px 10px",
        borderRadius: 100,
        border: `0.5px solid ${cfg.color}40`,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.6px" }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── StatTile ──────────────────────────────────────────────────────────────────

function StatTile({ label, value, unit, border }: { label: string; value: string; unit?: string; border?: boolean }) {
  return (
    <div
      style={{
        padding: "0 14px",
        textAlign: "center",
        borderLeft: border ? "0.5px solid var(--hairline-soft)" : "none",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "1.4px",
          color: "var(--ink-mute)",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 900,
          fontSize: 22,
          color: "var(--ink)",
          marginTop: 4,
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 11, color: "var(--ink-mute)", fontWeight: 500, marginLeft: 3 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ── JournalColumn ─────────────────────────────────────────────────────────────

function JournalColumn({
  visit,
  allVisits,
  onEdit,
  onAdd,
}: {
  visit: VisitData | null;
  allVisits: VisitData[];
  onEdit: () => void;
  onAdd: () => void;
}) {
  const paperBg = "#FAF3E0";
  const inkPaper = "#3A2E1C";
  const hairlinePaper = "rgba(58,46,28,0.22)";

  const latestVisit = allVisits
    .filter((v) => !v.is_bucket_list && v.visited_date)
    .sort((a, b) => new Date(b.visited_date!).getTime() - new Date(a.visited_date!).getTime())[0] ?? null;

  const earlierVisits = allVisits
    .filter((v) => !v.is_bucket_list && v.visited_date && v !== latestVisit)
    .sort((a, b) => new Date(b.visited_date!).getTime() - new Date(a.visited_date!).getTime());

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: d.getDate().toString(),
      full: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    };
  };

  return (
    <div
      style={{
        width: 420,
        flexShrink: 0,
        borderLeft: "0.5px solid var(--hairline)",
        background: paperBg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Journal header */}
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: `0.5px dashed ${hairlinePaper}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                letterSpacing: "1.6px",
                color: "var(--ink-mute)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              JOURNAL · FIELD NOTES
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: inkPaper,
                letterSpacing: -0.3,
                marginTop: 2,
              }}
            >
              Your entries
            </div>
          </div>
          {latestVisit ? (
            <DesktopButton size="sm" primary onClick={onEdit}>
              <PenLine size={13} strokeWidth={2} /> Edit
            </DesktopButton>
          ) : (
            <DesktopButton size="sm" primary onClick={onAdd}>
              <Plus size={13} strokeWidth={2.4} /> Log visit
            </DesktopButton>
          )}
        </div>
      </div>

      {/* Journal body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 24px", position: "relative" }}>
        {latestVisit ? (
          <div>
            {/* Date header */}
            {(() => {
              const d = formatDate(latestVisit.visited_date!);
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 56,
                      padding: "6px 0",
                      textAlign: "center",
                      background: "var(--primary)",
                      color: "#FFFBF1",
                      borderRadius: 8,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: 10, letterSpacing: "1.2px", opacity: 0.85, fontFamily: "var(--font-mono)" }}>
                      {d.month}
                    </div>
                    <div style={{ fontSize: 18 }}>{d.day}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: inkPaper }}>{d.full}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 1 }}>
                      {latestVisit.visibility ?? "Private"}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Title */}
            {latestVisit.title && (
              <div style={{ fontWeight: 700, fontSize: 16, color: inkPaper, marginBottom: 8 }}>
                {latestVisit.title}
              </div>
            )}

            {/* Notes */}
            {latestVisit.notes ? (
              <div
                style={{
                  fontSize: 15,
                  color: inkPaper,
                  lineHeight: 1.65,
                  marginBottom: 16,
                }}
              >
                {latestVisit.notes}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "var(--ink-mute)", fontStyle: "italic", marginBottom: 16 }}>
                No notes for this visit.
              </p>
            )}

            {/* Photos */}
            {latestVisit.photos && latestVisit.photos.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "1.4px",
                    color: "var(--ink-mute)",
                    textTransform: "uppercase",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  {latestVisit.photos.length} PHOTO{latestVisit.photos.length !== 1 ? "S" : ""}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                  {latestVisit.photos.slice(0, 9).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      style={{ width: "100%", height: 88, objectFit: "cover", borderRadius: 6 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Earlier visits */}
            {earlierVisits.length > 0 && (
              <div style={{ paddingTop: 16, borderTop: `0.5px dashed ${hairlinePaper}` }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "1.4px",
                    color: "var(--ink-mute)",
                    textTransform: "uppercase",
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  EARLIER VISITS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {earlierVisits.map((v, i) => {
                    const d = formatDate(v.visited_date!);
                    return (
                      <div
                        key={i}
                        style={{
                          background: "rgba(0,0,0,0.04)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          borderLeft: "2px solid var(--primary)",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9.5,
                            letterSpacing: "1px",
                            color: "var(--ink-mute)",
                            fontWeight: 600,
                          }}
                        >
                          {d.full.toUpperCase()}
                        </div>
                        {v.notes && (
                          <div style={{ fontSize: 12.5, color: inkPaper, marginTop: 3, lineHeight: 1.45 }}>
                            {v.notes}
                          </div>
                        )}
                        {v.title && !v.notes && (
                          <div style={{ fontSize: 12.5, color: inkPaper, marginTop: 3 }}>{v.title}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty journal CTA */
          <button
            onClick={onAdd}
            style={{
              width: "100%",
              padding: 40,
              border: "1.5px dashed var(--hairline)",
              background: "transparent",
              borderRadius: 14,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              color: "var(--ink-mute)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <PenLine size={28} strokeWidth={1.8} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Start your journal</div>
            <div style={{ fontSize: 12.5 }}>Notes, photos, companions — keep it for you.</div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ParkDetailPage({
  params,
}: {
  params: Promise<{ park_code: string }>;
}) {
  const { park_code } = use(params);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [park, setPark]       = useState<ParkData | null>(null);
  const [visits, setVisits]   = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog]   = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    Promise.all([
      fetch(`/api/parks/${park_code}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/visits").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([parkData, allVisits]) => {
        setPark(parkData);
        const parkVisits = (allVisits as VisitData[]).filter(
          (v) => v.park_code === park_code
        );
        setVisits(parkVisits);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isSignedIn, park_code]);

  const handleConfirmVisit = async (date: Date, journal: JournalData) => {
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        park_code,
        is_bucket_list: false,
        visited_date: date.toISOString(),
        title: journal.title,
        notes: journal.notes,
        photos: journal.photos,
        visibility: journal.visibility,
      }),
    });
    if (res.ok) {
      setVisits((prev) => [
        ...prev,
        {
          park_code,
          visited_date: date.toISOString(),
          is_bucket_list: false,
          title: journal.title ?? null,
          notes: journal.notes ?? null,
          photos: journal.photos ?? null,
          visibility: journal.visibility ?? null,
        },
      ]);
    }
    setShowAddDialog(false);
  };

  const latestVisit = visits
    .filter((v) => !v.is_bucket_list && v.visited_date)
    .sort((a, b) => new Date(b.visited_date!).getTime() - new Date(a.visited_date!).getTime())[0] ?? null;

  const status: "visited" | "bucketList" | "notVisited" = latestVisit
    ? "visited"
    : visits.some((v) => v.is_bucket_list)
    ? "bucketList"
    : "notVisited";

  if (loading || !park) {
    return (
      <DesktopShell fullbleed>
        <div className="flex items-center justify-center h-full" style={{ color: "var(--ink-mute)" }}>
          {loading ? "Loading…" : "Park not found."}
        </div>
      </DesktopShell>
    );
  }

  const stateLabel = park.states.split(",")[0]?.trim() ?? park.states;
  const gradient = parkGradient(park.park_code);

  return (
    <DesktopShell fullbleed>
      <div style={{ display: "flex", height: "100%" }}>

        {/* ── Left column ─────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            background: "var(--bg)",
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              padding: "18px 32px 0",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Link
              href="/map"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--ink-mute)",
                textDecoration: "none",
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              <ChevronLeft size={14} strokeWidth={2.2} /> Map
            </Link>
            <span style={{ color: "var(--ink-mute)", fontSize: 12 }}>›</span>
            <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 700 }}>
              {park.name}
            </span>
          </div>

          {/* Hero */}
          <div style={{ padding: "14px 32px 0" }}>
            <div
              style={{
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                height: 360,
              }}
            >
              <div style={{ width: "100%", height: "100%", background: gradient }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: 22,
                  right: 22,
                  color: "#FFFBF1",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <StatusChip status={status} />
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "rgba(255,251,241,0.85)",
                      letterSpacing: "1.4px",
                      textTransform: "uppercase",
                    }}
                  >
                    {stateLabel}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 44,
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  {park.name}
                </div>
              </div>
            </div>
          </div>

          {/* Photo strip — 4 gradient placeholders */}
          <div
            style={{
              padding: "14px 32px 0",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 120,
                  borderRadius: 10,
                  background: gradient,
                  opacity: 0.4 + i * 0.15,
                }}
              />
            ))}
          </div>

          {/* About */}
          {park.description && (
            <div style={{ padding: "24px 32px 16px" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "1.6px",
                  color: "var(--ink-mute)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                ABOUT
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "var(--ink-soft)",
                  lineHeight: 1.6,
                  maxWidth: 620,
                }}
              >
                {park.description}
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div style={{ padding: "0 32px 24px" }}>
            <div
              style={{
                background: "var(--surface)",
                border: "0.5px solid var(--hairline)",
                borderRadius: 12,
                padding: "14px 0",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
              }}
            >
              <StatTile label="State" value={stateLabel} />
              <StatTile label="Status" value={status === "visited" ? "✓" : status === "bucketList" ? "★" : "—"} border />
              <StatTile
                label="Visits"
                value={visits.filter((v) => !v.is_bucket_list && v.visited_date).length.toString()}
                unit="trips"
                border
              />
              <StatTile
                label="Photos"
                value={visits
                  .flatMap((v) => v.photos ?? [])
                  .length.toString()}
                unit="saved"
                border
              />
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ padding: "0 32px 32px", display: "flex", gap: 10 }}>
            {status !== "visited" ? (
              <DesktopButton primary onClick={() => setShowAddDialog(true)}>
                <Plus size={14} strokeWidth={2.4} /> Log a visit
              </DesktopButton>
            ) : (
              <DesktopButton onClick={() => setShowAddDialog(true)}>
                <Plus size={14} strokeWidth={2.4} /> Log another visit
              </DesktopButton>
            )}
            <Link href="/map" style={{ textDecoration: "none" }}>
              <DesktopButton>
                <MapPin size={14} strokeWidth={2} /> View on map
              </DesktopButton>
            </Link>
          </div>
        </div>

        {/* ── Right column — Journal ───────────────────────────────── */}
        <JournalColumn
          visit={latestVisit}
          allVisits={visits}
          onEdit={() => setShowEditDialog(true)}
          onAdd={() => setShowAddDialog(true)}
        />
      </div>

      {/* Dialogs */}
      <VisitDateDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        parkName={park.name}
        onConfirm={handleConfirmVisit}
      />
      {latestVisit && showEditDialog && (
        <EditVisitDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          parkName={park.name}
          existing={{
            visitedDate: latestVisit.visited_date ?? new Date().toISOString(),
            title: latestVisit.title,
            notes: latestVisit.notes,
            photos: latestVisit.photos,
            visibility: latestVisit.visibility,
          }}
          onSave={async (date, journal) => {
            const res = await fetch("/api/visits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                park_code,
                is_bucket_list: false,
                visited_date: date.toISOString(),
                title: journal.title,
                notes: journal.notes,
                photos: journal.photos,
                visibility: journal.visibility,
              }),
            });
            if (res.ok) {
              setVisits((prev) =>
                prev.map((v) =>
                  v === latestVisit
                    ? {
                        ...v,
                        visited_date: date.toISOString(),
                        title: journal.title ?? null,
                        notes: journal.notes ?? null,
                        photos: journal.photos ?? null,
                        visibility: journal.visibility ?? null,
                      }
                    : v
                )
              );
            }
            setShowEditDialog(false);
          }}
          onDelete={async () => {
            await fetch(`/api/visits?park_code=${park_code}`, { method: "DELETE" });
            setVisits((prev) =>
              prev.filter((v) => v !== latestVisit)
            );
            setShowEditDialog(false);
          }}
        />
      )}
    </DesktopShell>
  );
}
