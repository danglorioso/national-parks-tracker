"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/NavBar";
import ProgressCard from "@/components/ProgressCard";
import VisitDateDialog, { type JournalData } from "@/components/VisitDateDialog";
import EditVisitDialog from "@/components/EditVisitDialog";
import { ALL_BADGES, TIER_CONFIG, type BadgeDefinition } from "@/lib/badges";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  MapPin, Users, UserCheck, Lock, Globe, UserRound,
  CheckCircle2, Bookmark, CalendarDays, Search, Plus, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileInfo {
  clerk_user_id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  total_visit_count: number;
  hidden_months: { year: number; month: number; count: number }[];
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  viewer_follows: boolean;
  is_own_profile: boolean;
}

interface PublicVisit {
  id: number;
  park_code: string;
  park_name: string;
  visited_date: string;
  title: string | null;
  notes: string | null;
  photos: string[] | null;
  visibility: string | null;
}

interface ParkWithStatus {
  park_code: string;
  name: string;
  status: "visited" | "notVisited" | "bucketList";
  visitedDate: string | null;
  description?: string;
  title?: string | null;
  notes?: string | null;
  photos?: string[] | null;
  visibility?: string | null;
}

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
  public: <Globe className="w-3 h-3" />,
  friends: <UserCheck className="w-3 h-3" />,
  private: <Lock className="w-3 h-3" />,
};

type OwnTab = "visited" | "bucketList" | "explore" | "badges";
type OtherTab = "visits" | "badges";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [publicVisits, setPublicVisits] = useState<PublicVisit[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Record<string, string>>({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  // Own-profile state (mirrors /visits page)
  const [parks, setParks] = useState<ParkWithStatus[]>([]);
  const [totalParksCount, setTotalParksCount] = useState(0);
  const [visitedParksCount, setVisitedParksCount] = useState(0);
  const [bucketListCount, setBucketListCount] = useState(0);
  const [parksLoading, setParksLoading] = useState(false);
  const [badgesLoading, setBadgesLoading] = useState(false);

  const [ownTab, setOwnTab] = useState<OwnTab>("visited");
  const [otherTab, setOtherTab] = useState<OtherTab>("visits");
  const [searchQuery, setSearchQuery] = useState("");

  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [pendingParkCode, setPendingParkCode] = useState<string | null>(null);
  const [pendingParkName, setPendingParkName] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<{ badge: BadgeDefinition; earnedAt: string | null } | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/");
  }, [isLoaded, isSignedIn, router]);

  // Load profile + public visits + badges
  useEffect(() => {
    if (!username) return;
    setProfileLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push("/feed"); return; }
        setProfile(data.profile);
        setPublicVisits(data.visits);
        const earned: Record<string, string> = {};
        data.badges.forEach((b: { badge_id: string; earned_at: string }) => { earned[b.badge_id] = b.earned_at; });
        setEarnedBadges(earned);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [username, router]);

  // When own profile: load full park data + badges
  useEffect(() => {
    if (!profile?.is_own_profile) return;

    setParksLoading(true);
    setBadgesLoading(true);

    Promise.all([
      fetch("/api/parks").then(r => r.json()),
      fetch("/api/visits").then(r => r.json()),
    ]).then(([parksData, visitsData]) => {
      setTotalParksCount(parksData.length);
      const visitedCodes = new Set<string>();
      const bucketCodes = new Set<string>();
      const datesMap: Record<string, string> = {};
      const journalMap: Record<string, { title: string | null; notes: string | null; photos: string[] | null; visibility: string | null }> = {};
      visitsData.forEach((v: { park_code: string; is_bucket_list: boolean; visited_date: string | null; title: string | null; notes: string | null; photos: string[] | null; visibility: string | null }) => {
        if (v.is_bucket_list) bucketCodes.add(v.park_code);
        else if (v.visited_date) {
          visitedCodes.add(v.park_code);
          datesMap[v.park_code] = v.visited_date;
          journalMap[v.park_code] = { title: v.title, notes: v.notes, photos: v.photos, visibility: v.visibility };
        }
      });
      setVisitedParksCount(visitedCodes.size);
      setBucketListCount(bucketCodes.size);
      setParks(parksData.map((p: { park_code: string; name: string; description: string | null }) => ({
        park_code: p.park_code,
        name: p.name,
        status: visitedCodes.has(p.park_code) ? "visited" : bucketCodes.has(p.park_code) ? "bucketList" : "notVisited",
        visitedDate: datesMap[p.park_code] || null,
        description: p.description ?? undefined,
        ...(journalMap[p.park_code] ?? {}),
      })));
    }).catch(() => {}).finally(() => setParksLoading(false));

    fetch("/api/badges")
      .then(r => r.json())
      .then(data => { setEarnedBadges(data.earned ?? {}); })
      .catch(() => {})
      .finally(() => setBadgesLoading(false));
  }, [profile?.is_own_profile]);

  // ── Follow / unfollow ─────────────────────────────────────────────────────

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.viewer_follows) {
        await fetch(`/api/follows?following_id=${profile.clerk_user_id}`, { method: "DELETE" });
        setProfile(p => p ? { ...p, viewer_follows: false, follower_count: p.follower_count - 1 } : null);
      } else {
        await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ following_id: profile.clerk_user_id }),
        });
        setProfile(p => p ? { ...p, viewer_follows: true, follower_count: p.follower_count + 1 } : null);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Visit actions (own profile only) ─────────────────────────────────────

  const handleMarkVisited = (parkCode: string) => {
    const park = parks.find(p => p.park_code === parkCode);
    if (!park) return;
    setPendingParkCode(parkCode);
    setPendingParkName(park.name);
    setShowVisitDialog(true);
  };

  const handleConfirmVisitDate = async (date: Date, journal: JournalData) => {
    if (!pendingParkCode) return;
    const park = parks.find(p => p.park_code === pendingParkCode);
    const wasVisited = park?.status === "visited";
    const wasBucket = park?.status === "bucketList";
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (!res.ok) return;
      setParks(prev => prev.map(p => p.park_code === pendingParkCode
        ? { ...p, status: "visited", visitedDate: date.toISOString() } : p));
      if (!wasVisited) {
        setVisitedParksCount(n => n + 1);
        if (wasBucket) setBucketListCount(n => Math.max(0, n - 1));
      }
    } finally {
      setPendingParkCode(null);
      setPendingParkName("");
    }
  };

  const handleAddToBucketList = async (parkCode: string) => {
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ park_code: parkCode, is_bucket_list: true }),
    });
    if (!res.ok) return;
    setParks(prev => prev.map(p => p.park_code === parkCode ? { ...p, status: "bucketList" } : p));
    setBucketListCount(n => n + 1);
  };

  const handleEditVisit = async (parkCode: string, date: Date, journal: JournalData) => {
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    setParks(prev => prev.map(p => p.park_code === parkCode
      ? { ...p, visitedDate: date.toISOString(), title: journal.title, notes: journal.notes, photos: journal.photos ?? null, visibility: journal.visibility }
      : p));
  };

  const handleDeleteVisit = async (parkCode: string) => {
    const park = parks.find(p => p.park_code === parkCode);
    const wasVisited = park?.status === "visited";
    const wasBucket = park?.status === "bucketList";
    const res = await fetch(`/api/visits?park_code=${parkCode}`, { method: "DELETE" });
    if (!res.ok) return;
    setParks(prev => prev.map(p => p.park_code === parkCode
      ? { ...p, status: "notVisited", visitedDate: null } : p));
    if (wasVisited) setVisitedParksCount(n => Math.max(0, n - 1));
    if (wasBucket) setBucketListCount(n => Math.max(0, n - 1));
  };

  // ── Derived lists ─────────────────────────────────────────────────────────

  const q = searchQuery.toLowerCase();
  const visitedParks = parks.filter(p => p.status === "visited")
    .sort((a, b) => (b.visitedDate ?? "").localeCompare(a.visitedDate ?? ""));
  const bucketParks = parks.filter(p => p.status === "bucketList").sort((a, b) => a.name.localeCompare(b.name));
  const unvisitedParks = parks.filter(p => p.status === "notVisited").sort((a, b) => a.name.localeCompare(b.name));

  const filtered = {
    visited: visitedParks.filter(p => p.name.toLowerCase().includes(q)),
    bucket: bucketParks.filter(p => p.name.toLowerCase().includes(q)),
    explore: unvisitedParks.filter(p => p.name.toLowerCase().includes(q)),
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (!isLoaded || profileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-6xl mx-auto w-full px-4 py-8 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl bg-gray-200" />
          <Skeleton className="h-10 w-72 rounded-lg bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-gray-200" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwn = profile.is_own_profile;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Nav />

      {/* ── Profile Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Avatar */}
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username}
                className="w-16 h-16 rounded-full border-2 border-emerald-500 object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center shrink-0">
                <UserRound className="w-8 h-8 text-emerald-600" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {profile.full_name && (
                      <h1 className="text-xl font-bold text-gray-900">{profile.full_name}</h1>
                    )}
                    {isOwn && (
                      <Link href="/settings" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  <p className={`text-gray-500 ${profile.full_name ? "text-sm mt-0.5" : "text-xl font-bold text-gray-900"}`}>
                    @{profile.username}
                  </p>
                  {profile.bio && <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>}
                </div>
                {!isOwn && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={profile.viewer_follows ? "outline" : "default"}
                    size="sm"
                    className={profile.viewer_follows ? "" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                  >
                    {profile.viewer_follows ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>
                    <span className="font-semibold text-gray-900">{isOwn ? visitedParksCount : profile.total_visit_count}</span>
                    {isOwn ? `/${totalParksCount}` : ""} visited
                  </span>
                </div>
                {isOwn && (
                  <span>
                    <span className="font-semibold text-gray-900">{bucketListCount}</span> on bucket list
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span><span className="font-semibold text-gray-900">{profile.follower_count}</span> followers</span>
                </div>
                <span><span className="font-semibold text-gray-900">{profile.following_count}</span> following</span>
              </div>

            </div>

            {/* Progress card — own profile only */}
            {isOwn && (
              <div className="w-full sm:w-64 shrink-0">
                <ProgressCard
                  visitedCount={visitedParksCount}
                  totalCount={totalParksCount}
                  loading={parksLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Badges carousel — own profile only ── */}
      {isOwn && Object.keys(earnedBadges).length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Recent Badges</p>
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
              {ALL_BADGES
                .filter(b => b.id in earnedBadges)
                .sort((a, b) => new Date(earnedBadges[b.id]).getTime() - new Date(earnedBadges[a.id]).getTime())
                .map(badge => {
                  const tier = TIER_CONFIG[badge.tier];
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge({ badge, earnedAt: earnedBadges[badge.id] ?? null })}
                      className="flex flex-col items-center gap-1.5 shrink-0 group"
                      title={`${badge.name} — ${badge.description}`}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm ring-2 ring-white group-hover:scale-110 transition-transform"
                        style={{ background: tier.cssGradient }}
                      >
                        {badge.emoji}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium text-center leading-tight max-w-[52px] truncate">{badge.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {isOwn ? (
              ([
                { key: "visited", label: "Visited", count: visitedParksCount },
                { key: "bucketList", label: "Bucket List", count: bucketListCount },
                { key: "explore", label: "Explore", count: totalParksCount - visitedParksCount },
                { key: "badges", label: "Badges", count: Object.keys(earnedBadges).length },
              ] as { key: OwnTab; label: string; count: number }[]).map(tab => (
                <button key={tab.key} onClick={() => { setOwnTab(tab.key); setSearchQuery(""); }}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                    ownTab === tab.key
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {!parksLoading && tab.key !== "badges" && (
                    <span className={`text-xs rounded-full px-2 py-0.5 ${
                      ownTab === tab.key ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>{tab.count}</span>
                  )}
                  {tab.key === "badges" && !badgesLoading && (
                    <span className={`text-xs rounded-full px-2 py-0.5 ${
                      ownTab === tab.key ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))
            ) : (
              (["visits", "badges"] as OtherTab[]).map(t => (
                <button key={t} onClick={() => setOtherTab(t)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 capitalize transition-colors ${
                    otherTab === t
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "visits" ? `Visits (${publicVisits.length})` : `Badges (${Object.keys(earnedBadges).length})`}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">

        {/* Search bar — own profile tabs with lists */}
        {isOwn && ownTab !== "badges" && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <Input
              placeholder={`Search ${ownTab === "explore" ? "parks to explore" : ownTab === "bucketList" ? "bucket list" : "visited parks"}…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* ── Own profile tabs ── */}
        {isOwn && (
          <>
            {parksLoading && ownTab !== "badges" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : (
              <>
                {/* Visited */}
                {ownTab === "visited" && (
                  visitedParks.length === 0
                    ? <EmptyState icon={<CheckCircle2 className="h-10 w-10 text-gray-300" />}
                        title={searchQuery ? "No parks match your search" : "No visits yet"}
                        subtitle={searchQuery ? "Try a different search term" : "Start exploring and log your first visit!"} />
                    : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.visited.map(p => <VisitedCard key={p.park_code} park={p} onEdit={handleEditVisit} onDelete={handleDeleteVisit} />)}
                      </div>
                )}

                {/* Bucket List */}
                {ownTab === "bucketList" && (
                  filtered.bucket.length === 0
                    ? <EmptyState icon={<Bookmark className="h-10 w-10 text-gray-300" />}
                        title={searchQuery ? "No parks match your search" : "Bucket list is empty"}
                        subtitle={searchQuery ? "Try a different search term" : "Head to Explore to add parks you want to visit!"} />
                    : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.bucket.map(p => <BucketListCard key={p.park_code} park={p} onMarkVisited={handleMarkVisited} onDelete={handleDeleteVisit} />)}
                      </div>
                )}

                {/* Explore */}
                {ownTab === "explore" && (
                  filtered.explore.length === 0
                    ? <EmptyState icon={<MapPin className="h-10 w-10 text-gray-300" />}
                        title={searchQuery ? "No parks match your search" : "You've explored every park!"}
                        subtitle={searchQuery ? "Try a different search term" : "Incredible — you've visited all national parks. Legendary!"} />
                    : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.explore.map(p => <ExploreCard key={p.park_code} park={p} onAddToBucketList={handleAddToBucketList} onMarkVisited={handleMarkVisited} />)}
                      </div>
                )}

                {/* Badges — own profile */}
                {ownTab === "badges" && <BadgesGrid earnedBadges={earnedBadges} loading={badgesLoading} onBadgeClick={setSelectedBadge} />}
              </>
            )}
            {!parksLoading && visitedParks.length > 0 && (
              <OwnTimeline parks={visitedParks} onEdit={handleEditVisit} onDelete={handleDeleteVisit} />
            )}
          </>
        )}

        {/* ── Other profile tabs ── */}
        {!isOwn && (
          <>
            {otherTab === "visits" && (
              profile.total_visit_count === 0
                ? <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">No visits yet.</div>
                : <OtherTimeline visits={publicVisits} hiddenMonths={profile.hidden_months} />
            )}
            {otherTab === "badges" && <BadgesGrid earnedBadges={earnedBadges} loading={false} onBadgeClick={setSelectedBadge} />}
          </>
        )}
      </div>

      <VisitDateDialog
        open={showVisitDialog}
        onOpenChange={setShowVisitDialog}
        parkName={pendingParkName}
        onConfirm={handleConfirmVisitDate}
      />

      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge.badge}
          earnedAt={selectedBadge.earnedAt}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4">{icon}</div>
      <p className="text-base font-semibold text-gray-600">{title}</p>
      <p className="text-sm text-gray-400 mt-1 max-w-xs">{subtitle}</p>
    </div>
  );
}

function VisitedCard({ park, onEdit, onDelete }: {
  park: ParkWithStatus;
  onEdit: (parkCode: string, date: Date, journal: JournalData) => void;
  onDelete: (code: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const dateLabel = park.visitedDate
    ? new Date(park.visitedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <Link href={`/parks/${park.park_code}`} className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition-colors">
              {park.name}
            </Link>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="shrink-0 p-1 text-gray-300 hover:text-gray-600 transition-colors rounded"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {dateLabel && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateLabel}
          </div>
        )}
        {park.title && <p className="text-sm font-medium text-gray-800">{park.title}</p>}
        {park.notes && <p className="text-sm text-gray-500 line-clamp-2">{park.notes}</p>}
      </div>
      <EditVisitDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        parkName={park.name}
        existing={{
          visitedDate: park.visitedDate ?? new Date().toISOString(),
          title: park.title,
          notes: park.notes,
          photos: park.photos,
          visibility: park.visibility,
        }}
        onSave={(date, journal) => onEdit(park.park_code, date, journal)}
        onDelete={() => onDelete(park.park_code)}
      />
    </>
  );
}

function BucketListCard({ park, onMarkVisited, onDelete }: { park: ParkWithStatus; onMarkVisited: (code: string) => void; onDelete: (code: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <Bookmark className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <Link href={`/parks/${park.park_code}`} className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition-colors">
            {park.name}
          </Link>
        </div>
        <button onClick={() => onDelete(park.park_code)} className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors rounded">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <Button size="sm" onClick={() => onMarkVisited(park.park_code)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Mark as Visited
      </Button>
    </div>
  );
}

function ExploreCard({ park, onAddToBucketList, onMarkVisited }: { park: ParkWithStatus; onAddToBucketList: (code: string) => void; onMarkVisited: (code: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        <Link href={`/parks/${park.park_code}`} className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition-colors">
          {park.name}
        </Link>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onAddToBucketList(park.park_code)} className="flex-1 text-xs h-8 border-amber-300 text-amber-600 hover:bg-amber-50">
          <Plus className="h-3.5 w-3.5 mr-1" />Bucket List
        </Button>
        <Button size="sm" onClick={() => onMarkVisited(park.park_code)} className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Visited
        </Button>
      </div>
    </div>
  );
}

function PublicVisitCard({ visit }: { visit: PublicVisit }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/parks/${visit.park_code}`} className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
            {visit.park_name}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">{format(new Date(visit.visited_date), "MMMM d, yyyy")}</p>
        </div>
        {visit.visibility && (
          <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            {VISIBILITY_ICONS[visit.visibility]}
            <span className="capitalize">{visit.visibility}</span>
          </span>
        )}
      </div>
      {visit.title && <p className="text-sm font-medium text-gray-800">{visit.title}</p>}
      {visit.notes && <p className="text-sm text-gray-600 line-clamp-3">{visit.notes}</p>}
      {visit.photos && visit.photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {visit.photos.map((url, i) => (
            <img key={i} src={url} alt="visit photo" className="w-20 h-20 rounded-lg object-cover border border-gray-100" />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function groupByMonth<T>(items: T[], getDate: (item: T) => string) {
  const groups: Record<string, { year: number; month: number; items: T[] }> = {};
  items.forEach(item => {
    const d = new Date(getDate(item));
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), items: [] };
    groups[key].items.push(item);
  });
  return Object.values(groups).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
}

function TimelineMonthHeader({ year, month, count }: { year: number; month: number; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-sm font-semibold text-gray-700">{MONTH_NAMES[month]} {year}</h3>
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400">{count} visit{count !== 1 ? "s" : ""}</span>
    </div>
  );
}

function OwnTimeline({ parks, onEdit, onDelete }: {
  parks: ParkWithStatus[];
  onEdit: (parkCode: string, date: Date, journal: JournalData) => void;
  onDelete: (code: string) => void;
}) {
  if (parks.length === 0) return null;
  const groups = groupByMonth(parks, p => p.visitedDate!);
  return (
    <div className="mt-10">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Journey</h2>
      <p className="text-sm text-gray-400 mb-6">Your visits over time</p>
      <div className="space-y-10">
        {groups.map(group => (
          <div key={`${group.year}-${group.month}`}>
            <TimelineMonthHeader year={group.year} month={group.month} count={group.items.length} />
            <div className="space-y-2">
              {group.items
                .slice()
                .sort((a, b) => new Date(b.visitedDate!).getTime() - new Date(a.visitedDate!).getTime())
                .map(park => (
                  <TimelineVisitCard key={park.park_code} park={park} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OtherTimeline({ visits, hiddenMonths }: {
  visits: PublicVisit[];
  hiddenMonths: { year: number; month: number; count: number }[];
}) {
  // Merge visible visits and ghost month entries into a unified grouped structure
  const groups: Record<string, { year: number; month: number; visits: PublicVisit[]; hiddenCount: number }> = {};

  visits.forEach(v => {
    const d = new Date(v.visited_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), visits: [], hiddenCount: 0 };
    groups[key].visits.push(v);
  });

  hiddenMonths.forEach(({ year, month, count }) => {
    const key = `${year}-${month - 1}`;
    if (!groups[key]) groups[key] = { year, month: month - 1, visits: [], hiddenCount: 0 };
    groups[key].hiddenCount += count;
  });

  const sorted = Object.values(groups).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

  return (
    <div className="space-y-10">
      {sorted.map(group => {
        const total = group.visits.length + group.hiddenCount;
        return (
          <div key={`${group.year}-${group.month}`}>
            <TimelineMonthHeader year={group.year} month={group.month} count={total} />
            <div className="space-y-2">
              {group.visits
                .slice()
                .sort((a, b) => new Date(b.visited_date).getTime() - new Date(a.visited_date).getTime())
                .map(v => <PublicVisitCard key={v.id} visit={v} />)}
              {Array.from({ length: group.hiddenCount }).map((_, i) => (
                <GhostCard key={`ghost-${group.year}-${group.month}-${i}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineVisitCard({ park, onEdit, onDelete }: {
  park: ParkWithStatus;
  onEdit: (parkCode: string, date: Date, journal: JournalData) => void;
  onDelete: (code: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 self-center">
            {VISIBILITY_ICONS[park.visibility ?? 'public'] ?? VISIBILITY_ICONS['public']}
          </div>
          <div className="min-w-0">
            <Link href={`/parks/${park.park_code}`} className="text-sm font-medium text-gray-900 hover:text-emerald-600 transition-colors line-clamp-1">
              {park.name}
            </Link>
            {park.title && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{park.title}</p>}
            <p className="text-xs text-gray-400 mt-0.5">
              {park.visitedDate ? format(new Date(park.visitedDate), "MMMM d") : ""}
            </p>
          </div>
        </div>
        <button onClick={() => setEditOpen(true)} className="shrink-0 p-1 text-gray-300 hover:text-gray-600 transition-colors rounded">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      <EditVisitDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        parkName={park.name}
        existing={{
          visitedDate: park.visitedDate ?? new Date().toISOString(),
          title: park.title,
          notes: park.notes,
          photos: park.photos,
          visibility: park.visibility,
        }}
        onSave={(date, journal) => onEdit(park.park_code, date, journal)}
        onDelete={() => onDelete(park.park_code)}
      />
    </>
  );
}

function GhostCard() {
  return (
    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 px-4 py-3 flex items-center gap-3">
      <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0 self-center" />
      <p className="text-sm text-gray-400 italic">Visited a national park</p>
    </div>
  );
}

function BadgeModal({ badge, earnedAt, onClose }: { badge: BadgeDefinition; earnedAt: string | null; onClose: () => void }) {
  const tier = TIER_CONFIG[badge.tier];
  const isEarned = earnedAt !== null;
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="w-full max-w-xs text-center">
        <div className="flex flex-col items-center gap-4 py-2">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg ring-4 ring-white"
            style={isEarned ? { background: tier.cssGradient, boxShadow: "0 6px 24px -4px rgba(0,0,0,0.3)" } : { background: "#e5e7eb" }}
          >
            <span style={{ filter: isEarned ? "none" : "grayscale(1) opacity(0.4)" }}>{badge.emoji}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{badge.name}</h2>
            <span className={`text-xs font-semibold uppercase tracking-wide ${isEarned ? tier.labelColor : "text-gray-400"}`}>
              {tier.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{badge.description}</p>
          {isEarned ? (
            <p className="text-xs text-gray-400">
              Earned {format(new Date(earnedAt!), "MMMM d, yyyy")}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">Not yet earned</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BadgesGrid({ earnedBadges, loading, onBadgeClick }: {
  earnedBadges: Record<string, string>;
  loading: boolean;
  onBadgeClick: (sel: { badge: BadgeDefinition; earnedAt: string | null }) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-wrap gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        {Object.keys(earnedBadges).length} of {ALL_BADGES.length} earned
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-7">
        {ALL_BADGES.map(badge => {
          const isEarned = badge.id in earnedBadges;
          const tier = TIER_CONFIG[badge.tier];
          return (
            <button
              key={badge.id}
              onClick={() => onBadgeClick({ badge, earnedAt: earnedBadges[badge.id] ?? null })}
              className="flex flex-col items-center gap-2 w-16 group text-left"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-md ring-2 transition-transform group-hover:scale-110"
                style={isEarned
                  ? { background: tier.cssGradient, boxShadow: "0 4px 14px -2px rgba(0,0,0,0.25)" }
                  : { background: "#e5e7eb" }}
              >
                <span style={{ filter: isEarned ? "none" : "grayscale(1) opacity(0.4)" }}>{badge.emoji}</span>
              </div>
              <span className={`text-xs text-center leading-tight font-medium ${isEarned ? "text-gray-800" : "text-gray-400"}`}>
                {badge.name}
              </span>
              {isEarned && (
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${tier.labelColor}`}>{tier.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
