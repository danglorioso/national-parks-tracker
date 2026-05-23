"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DesktopShell } from "@/components/desktop/DesktopShell";
import { MapLeftPanel, type FilterStatus } from "@/components/desktop/MapLeftPanel";
import { MapRightPanel } from "@/components/desktop/MapRightPanel";
import Map from "@/components/Map";
import VisitDateDialog, { type JournalData } from "@/components/VisitDateDialog";
import EditVisitDialog from "@/components/EditVisitDialog";

interface ParkFromDB {
  park_code: string;
  name: string;
  states: string;
  latitude: string | null;
  longitude: string | null;
  description: string | null;
}

interface ParkForMap {
  park_code: string;
  name: string;
  states: string;
  position: [number, number];
  status: 'visited' | 'notVisited' | 'bucketList';
  description?: string;
  visitedDate?: string | null;
  title?: string | null;
  notes?: string | null;
  photos?: string[] | null;
  visibility?: string | null;
}


export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [parks, setParks] = useState<ParkForMap[]>([]);
  const [totalParksCount, setTotalParksCount] = useState(0);
  const [visitedParksCount, setVisitedParksCount] = useState(0);
  const [isLoadingParks, setIsLoadingParks] = useState(true);
  const [showVisitDateDialog, setShowVisitDateDialog] = useState(false);
  const [pendingParkCode, setPendingParkCode] = useState<string | null>(null);
  const [pendingParkName, setPendingParkName] = useState<string>("");
  const [pendingEdit, setPendingEdit] = useState<ParkForMap | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedParkCode, setSelectedParkCode] = useState<string | null>(null);

  // Derive selected park from parks state so it auto-updates after status changes
  const selectedPark = selectedParkCode
    ? parks.find((p) => p.park_code === selectedParkCode) ?? null
    : null;

  useEffect(() => {
    if (!isSignedIn && isLoaded) {
      router.push('/');
    }
  }, [isSignedIn, isLoaded, router]);

  useEffect(() => {
    fetchParksAndVisits();
  }, []);

  const fetchParksAndVisits = async () => {
    try {
      setIsLoadingParks(true);
      const [parksResponse, visitsResponse] = await Promise.all([
        fetch('/api/parks'),
        fetch('/api/visits')
      ]);

      if (!parksResponse.ok) throw new Error('Failed to fetch parks');

      const parksData: ParkFromDB[] = await parksResponse.json();
      setTotalParksCount(parksData.length);

      const visitedParkCodes: Set<string> = new Set();
      const bucketListParkCodes: Set<string> = new Set();
      const visitDatesMap: Record<string, string> = {};
      const journalMap: Record<string, { title: string | null; notes: string | null; photos: string[] | null; visibility: string | null }> = {};

      if (visitsResponse.ok) {
        const visitsData: Array<{ park_code: string; is_bucket_list: boolean; visited_date: string | null; title: string | null; notes: string | null; photos: string[] | null; visibility: string | null }> = await visitsResponse.json();
        visitsData.forEach(visit => {
          if (visit.is_bucket_list) {
            bucketListParkCodes.add(visit.park_code);
          } else if (visit.visited_date) {
            visitedParkCodes.add(visit.park_code);
            visitDatesMap[visit.park_code] = visit.visited_date;
            journalMap[visit.park_code] = { title: visit.title, notes: visit.notes, photos: visit.photos, visibility: visit.visibility };
          }
        });
        setVisitedParksCount(visitedParkCodes.size);
      } else {
        setVisitedParksCount(0);
      }

      const transformedParks: ParkForMap[] = parksData
        .filter(park => park.latitude && park.longitude)
        .map(park => {
          let status: 'visited' | 'notVisited' | 'bucketList' = 'notVisited';
          if (visitedParkCodes.has(park.park_code)) status = 'visited';
          else if (bucketListParkCodes.has(park.park_code)) status = 'bucketList';
          return {
            park_code: park.park_code,
            name: park.name,
            states: park.states,
            position: [parseFloat(park.latitude!), parseFloat(park.longitude!)] as [number, number],
            status,
            description: park.description || undefined,
            visitedDate: visitDatesMap[park.park_code] || null,
            ...(journalMap[park.park_code] ?? {}),
          };
        });

      setParks(transformedParks);
    } catch (error) {
      console.error('Error fetching parks:', error);
    } finally {
      setIsLoadingParks(false);
    }
  };

  const handleMarkVisited = (parkCode: string) => {
    const park = parks.find(p => p.park_code === parkCode);
    if (park) {
      setPendingParkCode(parkCode);
      setPendingParkName(park.name);
      setShowVisitDateDialog(true);
    }
  };

  const handleConfirmVisitDate = async (date: Date, journal: JournalData) => {
    if (!pendingParkCode) return;
    const park = parks.find(p => p.park_code === pendingParkCode);
    const wasAlreadyVisited = park?.status === 'visited';
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          park_code: pendingParkCode,
          is_bucket_list: false,
          visited_date: date.toISOString(),
          title: journal.title,
          notes: journal.notes,
          photos: journal.photos,
          visibility: journal.visibility,
        }),
      });
      if (!response.ok) throw new Error('Failed to mark park as visited');
      setParks(prev => prev.map(p =>
        p.park_code === pendingParkCode ? { ...p, status: 'visited' as const, visitedDate: date.toISOString() } : p
      ));
      if (!wasAlreadyVisited) setVisitedParksCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking park as visited:', error);
    } finally {
      setPendingParkCode(null);
      setPendingParkName("");
    }
  };

  const handleAddToBucketList = async (parkCode: string) => {
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ park_code: parkCode, is_bucket_list: true }),
      });
      if (!response.ok) throw new Error('Failed to add park to bucket list');
      setParks(prev => prev.map(p =>
        p.park_code === parkCode ? { ...p, status: 'bucketList' as const, visitedDate: null } : p
      ));
    } catch (error) {
      console.error('Error adding park to bucket list:', error);
    }
  };

  const handleRemoveFromBucketList = async (parkCode: string) => {
    try {
      const response = await fetch(`/api/visits?park_code=${parkCode}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove park from bucket list');
      setParks(prev => prev.map(p =>
        p.park_code === parkCode ? { ...p, status: 'notVisited' as const, visitedDate: null } : p
      ));
    } catch (error) {
      console.error('Error removing park from bucket list:', error);
    }
  };

  const handleEditVisit = async (parkCode: string, date: Date, journal: JournalData) => {
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        park_code: parkCode,
        is_bucket_list: false,
        visited_date: date.toISOString(),
        title: journal.title,
        notes: journal.notes,
        photos: journal.photos,
        visibility: journal.visibility,
      }),
    });
    if (!res.ok) return;
    setParks(prev => prev.map(p =>
      p.park_code === parkCode
        ? { ...p, visitedDate: date.toISOString(), title: journal.title, notes: journal.notes, photos: journal.photos ?? null, visibility: journal.visibility }
        : p
    ));
    setPendingEdit(null);
  };

  const handleMarkNotVisited = async (parkCode: string) => {
    try {
      const response = await fetch(`/api/visits?park_code=${parkCode}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to mark park as unvisited');
      setParks(prev => prev.map(p =>
        p.park_code === parkCode ? { ...p, status: 'notVisited' as const, visitedDate: null } : p
      ));
      setVisitedParksCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking park as unvisited:', error);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────

  const visitedParks = parks.filter(p => p.status === 'visited');

  const statesVisited = new Set(
    visitedParks.flatMap(p => p.states?.split(',').map(s => s.trim()).filter(Boolean) ?? [])
  ).size;

  const thisYear = new Date().getFullYear();
  const parksThisYear = visitedParks.filter(
    p => p.visitedDate && new Date(p.visitedDate).getFullYear() === thisYear
  ).length;

  const bucketListCount = parks.filter(p => p.status === 'bucketList').length;
  const unvisitedCount = parks.filter(p => p.status === 'notVisited' || p.status === 'bucketList').length;

  const recentVisits = [...visitedParks]
    .filter(p => p.visitedDate)
    .sort((a, b) => new Date(b.visitedDate!).getTime() - new Date(a.visitedDate!).getTime())
    .slice(0, 4)
    .map(p => ({ park_code: p.park_code, name: p.name, visitedDate: p.visitedDate! }));

  const filteredParks = filterStatus === 'all'
    ? parks
    : filterStatus === 'notVisited'
      ? parks.filter(p => p.status === 'notVisited' || p.status === 'bucketList')
      : parks.filter(p => p.status === filterStatus);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isSignedIn) {
    return (
      <DesktopShell fullbleed onLogVisit={() => handleMarkVisited(parks.find(p => p.status !== "visited")?.park_code ?? "")}>
        {/* Full-bleed map area with absolute floating panels */}
        <div className="relative h-full w-full" style={{ background: "#E8E2D0" }}>

          {/* Leaflet map */}
          <Map
            center={[39.8283, -98.5795]}
            zoom={4}
            className="h-full w-full"
            parks={filteredParks}
            selectedParkCode={selectedParkCode}
            onSelectPark={setSelectedParkCode}
          />

          {/* Left floating panel — park list + filter */}
          <MapLeftPanel
            parks={parks}
            filterStatus={filterStatus}
            onFilterChange={(f) => {
              setFilterStatus(f);
              setSelectedParkCode(null);
            }}
            selectedParkCode={selectedParkCode}
            onSelectPark={setSelectedParkCode}
            loading={isLoadingParks}
          />

          {/* Right floating panel — park detail peek */}
          {selectedPark && (
            <MapRightPanel
              park={selectedPark}
              onClose={() => setSelectedParkCode(null)}
              onMarkVisited={() => handleMarkVisited(selectedPark.park_code)}
              onAddToBucketList={() => handleAddToBucketList(selectedPark.park_code)}
              onRemoveFromBucketList={() => handleRemoveFromBucketList(selectedPark.park_code)}
              onEditVisit={() => setPendingEdit(selectedPark)}
            />
          )}

          {/* Top-center pill */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 15,
              background: "rgba(255,251,241,0.85)",
              backdropFilter: "blur(20px)",
              border: "0.5px solid var(--hairline)",
              borderRadius: 100,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ink-soft)",
              letterSpacing: "1.4px",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "var(--primary)" }}>●</span>
            {parks.length} PARKS · LEAFLET MAP
          </div>
        </div>

        <VisitDateDialog
          open={showVisitDateDialog}
          onOpenChange={setShowVisitDateDialog}
          parkName={pendingParkName}
          onConfirm={handleConfirmVisitDate}
        />
        {pendingEdit && (
          <EditVisitDialog
            open={!!pendingEdit}
            onOpenChange={(open) => { if (!open) setPendingEdit(null); }}
            parkName={pendingEdit.name}
            existing={{
              visitedDate: pendingEdit.visitedDate ?? new Date().toISOString(),
              title: pendingEdit.title,
              notes: pendingEdit.notes,
              photos: pendingEdit.photos,
              visibility: pendingEdit.visibility,
            }}
            onSave={(date, journal) => handleEditVisit(pendingEdit.park_code, date, journal)}
            onDelete={async () => {
              await handleMarkNotVisited(pendingEdit.park_code);
              setPendingEdit(null);
            }}
          />
        )}
      </DesktopShell>
    );
  }
}
