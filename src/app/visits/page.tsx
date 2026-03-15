"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import ProgressCard from "@/components/ProgressCard";
import VisitDateDialog from "@/components/VisitDateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Bookmark,
  MapPin,
  Trash2,
  CalendarDays,
  Search,
  Plus,
} from "lucide-react";

interface ParkFromDB {
  park_code: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  description: string | null;
}

interface ParkWithStatus {
  park_code: string;
  name: string;
  status: "visited" | "notVisited" | "bucketList";
  visitedDate: string | null;
  description?: string;
}

type ActiveTab = "visited" | "bucketList" | "explore";

export default function VisitsPage() {
  const { user, isSignedIn } = useUser();
  const [parks, setParks] = useState<ParkWithStatus[]>([]);
  const [totalParksCount, setTotalParksCount] = useState(0);
  const [visitedParksCount, setVisitedParksCount] = useState(0);
  const [bucketListCount, setBucketListCount] = useState(0);
  const [isLoadingParks, setIsLoadingParks] = useState(true);
  const [showVisitDateDialog, setShowVisitDateDialog] = useState(false);
  const [pendingParkCode, setPendingParkCode] = useState<string | null>(null);
  const [pendingParkName, setPendingParkName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("visited");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isSignedIn) {
      fetchParksAndVisits();
    }
  }, [isSignedIn]);

  const fetchParksAndVisits = async () => {
    try {
      setIsLoadingParks(true);
      setLoading(true);

      const [parksResponse, visitsResponse] = await Promise.all([
        fetch("/api/parks"),
        fetch("/api/visits"),
      ]);

      if (!parksResponse.ok) throw new Error("Failed to fetch parks");

      const parksData: ParkFromDB[] = await parksResponse.json();
      setTotalParksCount(parksData.length);

      const visitedParkCodes: Set<string> = new Set();
      const bucketListParkCodes: Set<string> = new Set();
      const visitDatesMap: Record<string, string> = {};

      if (visitsResponse.ok) {
        const visitsData: Array<{
          park_code: string;
          is_bucket_list: boolean;
          visited_date: string | null;
        }> = await visitsResponse.json();

        visitsData.forEach((visit) => {
          if (visit.is_bucket_list) {
            bucketListParkCodes.add(visit.park_code);
          } else if (visit.visited_date) {
            visitedParkCodes.add(visit.park_code);
            visitDatesMap[visit.park_code] = visit.visited_date;
          }
        });

        setVisitedParksCount(visitedParkCodes.size);
        setBucketListCount(bucketListParkCodes.size);
      } else {
        setVisitedParksCount(0);
        setBucketListCount(0);
      }

      const transformedParks: ParkWithStatus[] = parksData.map((park) => {
        let status: "visited" | "notVisited" | "bucketList" = "notVisited";
        if (visitedParkCodes.has(park.park_code)) status = "visited";
        else if (bucketListParkCodes.has(park.park_code))
          status = "bucketList";
        return {
          park_code: park.park_code,
          name: park.name,
          status,
          visitedDate: visitDatesMap[park.park_code] || null,
          description: park.description || undefined,
        };
      });

      setParks(transformedParks);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching parks:", error);
    } finally {
      setIsLoadingParks(false);
    }
  };

  const handleMarkVisited = (parkCode: string) => {
    const park = parks.find((p) => p.park_code === parkCode);
    if (park) {
      setPendingParkCode(parkCode);
      setPendingParkName(park.name);
      setShowVisitDateDialog(true);
    }
  };

  const handleConfirmVisitDate = async (date: Date) => {
    if (!pendingParkCode) return;

    const park = parks.find((p) => p.park_code === pendingParkCode);
    const wasAlreadyVisited = park?.status === "visited";
    const wasBucketList = park?.status === "bucketList";

    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          park_code: pendingParkCode,
          is_bucket_list: false,
          visited_date: date.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to mark park as visited");

      setParks((prev) =>
        prev.map((p) =>
          p.park_code === pendingParkCode
            ? { ...p, status: "visited" as const, visitedDate: date.toISOString() }
            : p
        )
      );

      if (!wasAlreadyVisited) {
        setVisitedParksCount((prev) => prev + 1);
        if (wasBucketList) setBucketListCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking park as visited:", error);
    } finally {
      setPendingParkCode(null);
      setPendingParkName("");
      setShowVisitDateDialog(false);
    }
  };

  const handleAddToBucketList = async (parkCode: string) => {
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ park_code: parkCode, is_bucket_list: true }),
      });

      if (!response.ok) throw new Error("Failed to add to bucket list");

      setParks((prev) =>
        prev.map((p) =>
          p.park_code === parkCode
            ? { ...p, status: "bucketList" as const }
            : p
        )
      );
      setBucketListCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding to bucket list:", error);
    }
  };

  const handleDeleteVisit = async (parkCode: string) => {
    const park = parks.find((p) => p.park_code === parkCode);
    const wasVisited = park?.status === "visited";
    const wasBucketList = park?.status === "bucketList";

    try {
      const response = await fetch(`/api/visits?park_code=${parkCode}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove visit");

      setParks((prev) =>
        prev.map((p) =>
          p.park_code === parkCode
            ? { ...p, status: "notVisited" as const, visitedDate: null }
            : p
        )
      );

      if (wasVisited) setVisitedParksCount((prev) => Math.max(0, prev - 1));
      if (wasBucketList) setBucketListCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error removing visit:", error);
    }
  };

  const visitedParks = parks
    .filter((p) => p.status === "visited")
    .sort((a, b) => {
      if (!a.visitedDate) return 1;
      if (!b.visitedDate) return -1;
      return new Date(b.visitedDate).getTime() - new Date(a.visitedDate).getTime();
    });

  const bucketListParks = parks
    .filter((p) => p.status === "bucketList")
    .sort((a, b) => a.name.localeCompare(b.name));

  const unvisitedParks = parks
    .filter((p) => p.status === "notVisited")
    .sort((a, b) => a.name.localeCompare(b.name));

  const q = searchQuery.toLowerCase();
  const filteredVisited = visitedParks.filter((p) =>
    p.name.toLowerCase().includes(q)
  );
  const filteredBucketList = bucketListParks.filter((p) =>
    p.name.toLowerCase().includes(q)
  );
  const filteredUnvisited = unvisitedParks.filter((p) =>
    p.name.toLowerCase().includes(q)
  );

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const tabs: { key: ActiveTab; label: string; count: number }[] = [
    { key: "visited", label: "Visited", count: visitedParksCount },
    { key: "bucketList", label: "Bucket List", count: bucketListCount },
    {
      key: "explore",
      label: "Explore",
      count: totalParksCount - visitedParksCount,
    },
  ];

  const profileImageUrl = user?.imageUrl || "";
  const fullName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : "My";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar
        visitedParksCount={visitedParksCount}
        totalParksCount={totalParksCount}
      />

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={fullName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full border-3 border-emerald-500 object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-3 border-emerald-500 shrink-0" />
            )}

            {/* Name + Stats */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">
                {fullName}&apos;s Park Journal
              </h1>
              {loading ? (
                <div className="flex gap-4 mt-1">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm text-gray-500">
                  <span>
                    <span className="font-semibold text-gray-900">
                      {visitedParksCount}
                    </span>{" "}
                    visited
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900">
                      {bucketListCount}
                    </span>{" "}
                    on bucket list
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900">
                      {totalParksCount - visitedParksCount}
                    </span>{" "}
                    to explore
                  </span>
                </div>
              )}
            </div>

            {/* Progress Card */}
            <div className="w-full sm:w-64 shrink-0">
              <ProgressCard
                visitedCount={visitedParksCount}
                totalCount={totalParksCount}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {!loading && (
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      activeTab === tab.key
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          <Input
            placeholder={`Search ${activeTab === "explore" ? "parks to explore" : activeTab === "bucketList" ? "bucket list" : "visited parks"}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading skeletons */}
        {isLoadingParks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Visited Tab */}
            {activeTab === "visited" && (
              <>
                {filteredVisited.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-10 w-10 text-gray-300" />}
                    title={searchQuery ? "No parks match your search" : "No visits yet"}
                    subtitle={
                      searchQuery
                        ? "Try a different search term"
                        : "Start exploring and log your first park visit!"
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVisited.map((park) => (
                      <VisitedCard
                        key={park.park_code}
                        park={park}
                        onDelete={handleDeleteVisit}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Bucket List Tab */}
            {activeTab === "bucketList" && (
              <>
                {filteredBucketList.length === 0 ? (
                  <EmptyState
                    icon={<Bookmark className="h-10 w-10 text-gray-300" />}
                    title={searchQuery ? "No parks match your search" : "Bucket list is empty"}
                    subtitle={
                      searchQuery
                        ? "Try a different search term"
                        : "Head to Explore to add parks you want to visit!"
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBucketList.map((park) => (
                      <BucketListCard
                        key={park.park_code}
                        park={park}
                        onMarkVisited={handleMarkVisited}
                        onDelete={handleDeleteVisit}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Explore Tab */}
            {activeTab === "explore" && (
              <>
                {filteredUnvisited.length === 0 ? (
                  <EmptyState
                    icon={<MapPin className="h-10 w-10 text-gray-300" />}
                    title={
                      searchQuery
                        ? "No parks match your search"
                        : "You've explored every park!"
                    }
                    subtitle={
                      searchQuery
                        ? "Try a different search term"
                        : "Incredible — you've visited all national parks. Legendary!"
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUnvisited.map((park) => (
                      <ExploreCard
                        key={park.park_code}
                        park={park}
                        onAddToBucketList={handleAddToBucketList}
                        onMarkVisited={handleMarkVisited}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <VisitDateDialog
        open={showVisitDateDialog}
        onOpenChange={setShowVisitDateDialog}
        parkName={pendingParkName}
        onConfirm={handleConfirmVisitDate}
      />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4">{icon}</div>
      <p className="text-base font-semibold text-gray-600">{title}</p>
      <p className="text-sm text-gray-400 mt-1 max-w-xs">{subtitle}</p>
    </div>
  );
}

function VisitedCard({
  park,
  onDelete,
}: {
  park: ParkWithStatus;
  onDelete: (code: string) => void;
}) {
  const dateLabel = park.visitedDate
    ? new Date(park.visitedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {park.name}
          </p>
        </div>
        <button
          onClick={() => onDelete(park.park_code)}
          className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
          aria-label={`Remove ${park.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {dateLabel && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {dateLabel}
        </div>
      )}
    </div>
  );
}

function BucketListCard({
  park,
  onMarkVisited,
  onDelete,
}: {
  park: ParkWithStatus;
  onMarkVisited: (code: string) => void;
  onDelete: (code: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <Bookmark className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {park.name}
          </p>
        </div>
        <button
          onClick={() => onDelete(park.park_code)}
          className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
          aria-label={`Remove ${park.name} from bucket list`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Button
        size="sm"
        onClick={() => onMarkVisited(park.park_code)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
      >
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Mark as Visited
      </Button>
    </div>
  );
}

function ExploreCard({
  park,
  onAddToBucketList,
  onMarkVisited,
}: {
  park: ParkWithStatus;
  onAddToBucketList: (code: string) => void;
  onMarkVisited: (code: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
          {park.name}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddToBucketList(park.park_code)}
          className="flex-1 text-xs h-8 border-amber-300 text-amber-600 hover:bg-amber-50"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Bucket List
        </Button>
        <Button
          size="sm"
          onClick={() => onMarkVisited(park.park_code)}
          className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Visited
        </Button>
      </div>
    </div>
  );
}
