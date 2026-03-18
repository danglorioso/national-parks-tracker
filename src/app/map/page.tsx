"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/NavBar";
import ProgressCard from "@/components/ProgressCard";
import QuickStats from "@/components/QuickStats";
import RecentVisits from "@/components/RecentBadges";
import Legend from "@/components/Legend";
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

type FilterStatus = 'all' | 'visited' | 'bucketList' | 'notVisited';

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All Parks' },
  { key: 'visited', label: 'Visited' },
  { key: 'bucketList', label: 'Bucket List' },
  { key: 'notVisited', label: 'Unvisited' },
];

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
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

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
      <div className="flex flex-col h-screen">
        <Nav />

        <div className="flex flex-1 flex-col md:flex-row min-h-0 overflow-hidden">

          {/* ── Left Sidebar ── */}
          <div className="w-full md:w-72 bg-white border-r border-gray-200 overflow-y-auto p-5 max-h-[40vh] md:max-h-none space-y-6 shrink-0">
            <ProgressCard
              visitedCount={visitedParksCount}
              totalCount={totalParksCount}
              loading={isLoadingParks}
            />
            <QuickStats
              statesVisited={statesVisited}
              parksThisYear={parksThisYear}
              bucketListCount={bucketListCount}
              unvisitedCount={unvisitedCount}
              loading={isLoadingParks}
            />
            <RecentVisits visits={recentVisits} loading={isLoadingParks} />
          </div>

          {/* ── Right: filter bar + map ── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* Filter bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shrink-0">
              {FILTERS.map(({ key, label }) => {
                const counts: Record<FilterStatus, number> = {
                  all: parks.length,
                  visited: visitedParksCount,
                  bucketList: bucketListCount,
                  notVisited: unvisitedCount,
                };
                const isActive = filterStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                    {!isLoadingParks && (
                      <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                      }`}>
                        {counts[key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Map */}
            <div className="flex-1 relative overflow-hidden z-0">
              {isLoadingParks ? (
                <div className="flex items-center justify-center h-full bg-gray-100 animate-pulse" />
              ) : (
                <>
                  <Map
                    center={[39.8283, -98.5795]}
                    zoom={4}
                    className="h-full w-full"
                    parks={filteredParks}
                    onMarkVisited={handleMarkVisited}
                    onAddToBucketList={handleAddToBucketList}
                    onRemoveFromBucketList={handleRemoveFromBucketList}
                    onMarkNotVisited={handleMarkNotVisited}
                    onEditVisit={(parkCode) => {
                      const park = parks.find(p => p.park_code === parkCode);
                      if (park) setPendingEdit(park);
                    }}
                  />
                  <div className="absolute bottom-4 left-4 z-[100]">
                    <Legend />
                  </div>
                </>
              )}
            </div>
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
      </div>
    );
  }
}
