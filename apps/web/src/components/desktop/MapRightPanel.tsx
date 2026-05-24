"use client";

import { useState, useEffect } from "react";
import { X, Check, Bookmark, BookmarkX, ArrowRight, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { fullStateName } from "@/lib/stateNames";
import { LightboxModal, type LightboxImage } from "@/components/LightboxModal";

interface Park {
  park_code: string;
  name: string;
  states: string;
  status: "visited" | "notVisited" | "bucketList";
  description?: string;
  visitedDate?: string | null;
  notes?: string | null;
  photos?: string[] | null;
}

interface Props {
  park: Park;
  onClose: () => void;
  onMarkVisited: () => void;
  onAddToBucketList: () => void;
  onRemoveFromBucketList: () => void;
  onEditVisit: () => void;
}

function parkGradient(code: string): string {
  const palettes = [
    ["#3F5949", "#7C8E69"],
    ["#5C6B4B", "#A89668"],
    ["#B86A3E", "#E0A368"],
    ["#8B5A3C", "#C28A5C"],
    ["#3F5C6B", "#7B9CA8"],
    ["#2D4F66", "#6B8EA8"],
    ["#4A3F5C", "#8B7BA8"],
    ["#5C4A3F", "#A88B7C"],
  ];
  const idx = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length;
  const [c1, c2] = palettes[idx];
  return `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`;
}

function StatusChip({ status }: { status: Park["status"] }) {
  const cfg = {
    visited:    { label: "✓ Visited",     bg: "rgba(47,122,74,0.85)" },
    bucketList: { label: "⊙ Bucket list", bg: "rgba(216,154,58,0.85)" },
    notVisited: { label: "○ Not visited", bg: "rgba(168,162,154,0.80)" },
  }[status];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "3px 9px", borderRadius: 100,
        background: cfg.bg, fontSize: 10.5, fontWeight: 700,
        color: "#FFFBF1", letterSpacing: "0.4px", backdropFilter: "blur(8px)",
      }}
    >
      {cfg.label}
    </span>
  );
}

function ActionBtn({
  bg, color, border, children, onClick,
  flex = "1", padding = "10px 0", as: Tag = "button", href,
}: {
  bg: string; color: string; border?: string; children: React.ReactNode;
  onClick?: () => void; flex?: string; padding?: string;
  as?: "button" | "a"; href?: string;
}) {
  const style: React.CSSProperties = {
    flex, background: bg, color, border: border ?? "none",
    padding, borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 5, textDecoration: "none",
  };
  if (Tag === "a") return <a href={href} style={style}>{children}</a>;
  return <button onClick={onClick} style={style}>{children}</button>;
}

// Arrow button used in the carousel
function CarouselArrow({ dir, onClick }: { dir: "left" | "right"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "left" ? "left" : "right"]: 8,
        width: 28, height: 28, borderRadius: "50%",
        background: "rgba(20,17,12,0.55)", border: "none",
        cursor: "pointer", color: "#FFFBF1",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2,
      }}
    >
      {dir === "left"
        ? <ChevronLeft style={{ width: 15, height: 15 }} strokeWidth={2.4} />
        : <ChevronRight style={{ width: 15, height: 15 }} strokeWidth={2.4} />}
    </button>
  );
}

export function MapRightPanel({ park, onClose, onMarkVisited, onAddToBucketList, onRemoveFromBucketList, onEditVisit }: Props) {
  const [npsImages, setNpsImages] = useState<LightboxImage[]>([]);
  const [imgIdx, setImgIdx]       = useState(0);
  const [lightbox, setLightbox]   = useState<number | null>(null);

  useEffect(() => {
    setNpsImages([]);
    setImgIdx(0);
    fetch(`/api/parks/${park.park_code}/images`)
      .then((r) => r.json())
      .then((data) => {
        const imgs: LightboxImage[] = (data.images ?? []).map(
          (img: { url: string; title?: string; altText?: string }) => ({
            url: img.url,
            caption: img.title || undefined,
          })
        );
        setNpsImages(imgs);
      })
      .catch(() => {});
  }, [park.park_code]);

  // Build carousel images: user photos first, then NPS
  const userPhotos: LightboxImage[] = (park.photos ?? []).map((url) => ({ url }));
  const allImages: LightboxImage[] = [...userPhotos, ...npsImages];

  const heroImage = allImages[imgIdx] ?? null;
  const total = allImages.length;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + total) % total);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % total);
  };

  const firstState = fullStateName(park.states.split(",")[0].trim());
  const lastVisitDate = park.visitedDate
    ? new Date(park.visitedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <>
      <div
        style={{
          position: "absolute", top: 64, right: 16, bottom: 80, width: 360, zIndex: 20,
          background: "rgba(255,251,241,0.94)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "0.5px solid var(--hairline)", borderRadius: 14,
          boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "pqPeekInD 220ms cubic-bezier(.2,.7,.3,1)",
        }}
      >
        <style>{`@keyframes pqPeekInD { from { opacity:0; transform:translateX(8px) } to { opacity:1; transform:translateX(0) } }`}</style>

        {/* Hero / carousel */}
        <div style={{ position: "relative", height: 200, flexShrink: 0, background: parkGradient(park.park_code) }}>
          {heroImage && (
            <img
              src={heroImage.url}
              alt={heroImage.caption ?? park.name}
              onClick={() => total > 0 && setLightbox(imgIdx)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
            />
          )}

          {/* Carousel arrows */}
          {total > 1 && (
            <>
              <CarouselArrow dir="left"  onClick={goPrev} />
              <CarouselArrow dir="right" onClick={goNext} />
            </>
          )}

          {/* Dot indicators — aligned with status badge row */}
          {total > 1 && (
            <div
              style={{
                position: "absolute", bottom: 12, right: 14,
                display: "flex", alignItems: "center", gap: 5, pointerEvents: "none",
              }}
            >
              {allImages.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: i === imgIdx ? "#FFFBF1" : "rgba(255,251,241,0.40)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 10, right: 10, width: 28, height: 28,
              borderRadius: 14, background: "rgba(20,17,12,0.55)", border: 0,
              cursor: "pointer", color: "#FFFBF1",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X style={{ width: 14, height: 14 }} strokeWidth={2.4} />
          </button>

          {/* Status chip */}
          <div style={{ position: "absolute", bottom: 10, left: 14 }}>
            <StatusChip status={park.status} />
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Name + state */}
          <div style={{ padding: "14px 18px 12px" }}>
            <a
              href={`/parks/${park.park_code}`}
              style={{ fontWeight: 800, fontSize: 22, color: "var(--ink)", letterSpacing: -0.3, lineHeight: 1.1, textDecoration: "none", display: "block" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
            >
              {park.name}
            </a>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-mute)", letterSpacing: "0.8px", marginTop: 3, fontWeight: 600 }}>
              {firstState}
            </div>
          </div>

          {/* Description */}
          {park.description && (
            <div style={{ padding: "12px 18px", borderTop: "0.5px solid var(--hairline-soft)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "1.4px", color: "var(--ink-mute)", fontWeight: 600, marginBottom: 6 }}>
                ABOUT THIS PARK
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
                {park.description}
              </div>
            </div>
          )}

          {/* Last visit */}
          {park.status === "visited" && (park.notes || lastVisitDate) && (
            <div style={{ padding: "12px 18px", borderTop: "0.5px solid var(--hairline-soft)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "1.4px", color: "var(--ink-mute)", fontWeight: 600 }}>
                YOUR LAST VISIT{lastVisitDate ? ` · ${lastVisitDate.toUpperCase()}` : ""}
              </div>
              {park.notes && (
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.55 }}>
                  {park.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action row */}
        <div style={{ padding: 14, borderTop: "0.5px solid var(--hairline-soft)", display: "flex", gap: 8, flexShrink: 0 }}>
          {park.status === "visited" ? (
            <>
              <ActionBtn bg="var(--surface-alt)" color="var(--ink)" onClick={onEditVisit}>
                <Pencil style={{ width: 14, height: 14 }} strokeWidth={2} />
                Edit visit
              </ActionBtn>
              <ActionBtn bg="var(--primary)" color="#FFFBF1" onClick={onMarkVisited}>
                <Check style={{ width: 14, height: 14 }} strokeWidth={2.4} />
                Log a visit
              </ActionBtn>
            </>
          ) : (
            <>
              <ActionBtn bg="var(--visited)" color="#FFFBF1" onClick={onMarkVisited}>
                <Check style={{ width: 14, height: 14 }} strokeWidth={2.4} />
                Mark visited
              </ActionBtn>
              {park.status === "bucketList" ? (
                <ActionBtn bg="var(--surface-alt)" color="var(--ink)" onClick={onRemoveFromBucketList}>
                  <BookmarkX style={{ width: 14, height: 14 }} strokeWidth={2} />
                  On bucket list
                </ActionBtn>
              ) : (
                <ActionBtn bg="var(--surface-alt)" color="var(--ink)" onClick={onAddToBucketList}>
                  <Bookmark style={{ width: 14, height: 14 }} strokeWidth={2} />
                  Bucket list
                </ActionBtn>
              )}
            </>
          )}
          <ActionBtn as="a" href={`/parks/${park.park_code}`} bg="var(--surface)" color="var(--ink)" border="0.5px solid var(--hairline)" flex="0 0 auto" padding="10px 12px">
            <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.4} />
          </ActionBtn>
        </div>
      </div>

      {lightbox !== null && allImages.length > 0 && (
        <LightboxModal
          images={allImages}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
