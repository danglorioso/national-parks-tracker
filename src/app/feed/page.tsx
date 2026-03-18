"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/NavBar";
import { TIER_CONFIG } from "@/lib/badges";
import { format } from "date-fns";
import { MapPin, UserRound, Users, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type VisitItem = {
  type: 'visit';
  user_id: string;
  username: string;
  avatar_url: string | null;
  park_name: string;
  park_code: string;
  visited_date: string;
  title: string | null;
  notes: string | null;
  photos: string[] | null;
  visibility: string;
};

type BadgeItem = {
  type: 'badge';
  user_id: string;
  username: string;
  avatar_url: string | null;
  badge_id: string;
  badge_name: string;
  badge_emoji: string;
  badge_tier: string;
  earned_at: string;
};

type FeedItem = VisitItem | BadgeItem;
type FeedMode = 'friends' | 'explore';

interface LeaderboardUser {
  rank: number;
  clerk_user_id: string;
  username: string;
  avatar_url: string | null;
  visit_count: number;
}

interface TopPark {
  park_code: string;
  park_name: string;
  visit_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function UserAvatar({ url, username, className = "w-9 h-9" }: { url: string | null; username: string; className?: string }) {
  if (url) return <img src={url} alt={username} className={`${className} rounded-full object-cover border border-gray-200 shrink-0`} />;
  return (
    <div className={`${className} rounded-full bg-emerald-100 flex items-center justify-center shrink-0`}>
      <UserRound className="w-5 h-5 text-emerald-600" />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [mode, setMode] = useState<FeedMode>('friends');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  // Sidebar state
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [topParks, setTopParks] = useState<TopPark[]>([]);
  const [lbPeriod, setLbPeriod] = useState<'alltime' | 'lastyear'>('alltime');
  const [lbLoading, setLbLoading] = useState(true);
  const [followingLeaderboard, setFollowingLeaderboard] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/');
  }, [isLoaded, isSignedIn, router]);

  const loadFeed = useCallback(async (currentOffset: number, currentMode: FeedMode) => {
    const res = await fetch(`/api/feed?offset=${currentOffset}&mode=${currentMode}`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(prev => currentOffset === 0 ? data.items : [...prev, ...data.items]);
    setHasMore(data.hasMore);
    setOffset(currentOffset + data.items.length);
  }, []);

  // Initial load
  useEffect(() => {
    if (!isSignedIn) return;
    setLoading(true);
    Promise.all([
      loadFeed(0, mode),
      fetch('/api/follows?type=following').then(r => r.json()).then((list: Array<{ clerk_user_id: string }>) => {
        setFollowing(new Set(list.map(f => f.clerk_user_id)));
      }),
    ]).finally(() => setLoading(false));
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when mode changes
  const switchMode = (newMode: FeedMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setItems([]);
    setOffset(0);
    setHasMore(false);
    setLoading(true);
    loadFeed(0, newMode).finally(() => setLoading(false));
  };

  // Load leaderboard
  const loadLeaderboard = useCallback(async (period: 'alltime' | 'lastyear') => {
    setLbLoading(true);
    const res = await fetch(`/api/leaderboard?period=${period}`);
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(data.users ?? []);
      setTopParks(data.topParks ?? []);
    }
    setLbLoading(false);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    loadLeaderboard(lbPeriod);
  }, [isSignedIn, lbPeriod, loadLeaderboard]);

  const handleFollow = async (userId: string) => {
    await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following_id: userId }),
    });
    setFollowing(prev => new Set([...prev, userId]));
    setFollowingLeaderboard(prev => new Set([...prev, userId]));
    if (mode === 'friends') {
      setItems([]);
      setOffset(0);
      loadFeed(0, 'friends');
    }
  };

  if (!isLoaded) return null;

  const viewerId = user?.id;

  const emptyMessage = mode === 'friends'
    ? { title: "Nothing here yet", sub: "Follow other explorers to see their visits and badges here." }
    : { title: "No public activity yet", sub: "Be the first to log a public visit!" };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">

          {/* ── Main feed ── */}
          <div className="flex-1 min-w-0">

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-5 w-fit">
              <button
                onClick={() => switchMode('friends')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'friends' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Friends
              </button>
              <button
                onClick={() => switchMode('explore')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'explore' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Explore
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl bg-gray-200" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700">{emptyMessage.title}</p>
                <p className="text-sm text-gray-500">{emptyMessage.sub}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <FeedCard key={idx} item={item} />
                ))}
                {hasMore && (
                  <Button variant="outline" className="w-full" onClick={() => loadFeed(offset, mode)}>
                    Load more
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-5 w-72 shrink-0">

            {/* Leaderboard */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Top Explorers</h2>
                </div>
                <div className="flex gap-1">
                  {(['alltime', 'lastyear'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setLbPeriod(p)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                        lbPeriod === p ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {p === 'alltime' ? 'All time' : 'This year'}
                    </button>
                  ))}
                </div>
              </div>

              {lbLoading ? (
                <div className="space-y-2.5">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-1">
                  {leaderboard.map(user => {
                    const isFollowing = following.has(user.clerk_user_id) || followingLeaderboard.has(user.clerk_user_id);
                    return (
                      <div key={user.clerk_user_id} className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className={`text-xs font-bold w-4 text-center shrink-0 ${
                          user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-gray-400' : user.rank === 3 ? 'text-amber-700' : 'text-gray-300'
                        }`}>
                          {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
                        </span>
                        <UserAvatar url={user.avatar_url} username={user.username} className="w-7 h-7" />
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${user.username}`} className="text-xs font-medium text-gray-900 hover:text-emerald-600 truncate block">
                            @{user.username}
                          </Link>
                          <p className="text-[10px] text-gray-400">{user.visit_count} park{user.visit_count !== 1 ? 's' : ''}</p>
                        </div>
                        {!isFollowing && viewerId !== user.clerk_user_id && (
                          <button
                            onClick={() => handleFollow(user.clerk_user_id)}
                            className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 shrink-0"
                          >
                            Follow
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top parks */}
            {topParks.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Trending Parks
                  </h2>
                  <span className="text-[10px] text-gray-400">{lbPeriod === 'lastyear' ? 'this year' : 'all time'}</span>
                </div>
                <div className="space-y-1.5">
                  {topParks.map((park, i) => (
                    <Link
                      key={park.park_code}
                      href={`/parks/${park.park_code}`}
                      className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-bold text-gray-300 w-4 text-center shrink-0">{i + 1}</span>
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{park.park_name}</p>
                        <p className="text-[10px] text-gray-400">{park.visit_count} visit{park.visit_count !== 1 ? 's' : ''}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Feed card ────────────────────────────────────────────────────────────────

function FeedCard({ item }: { item: FeedItem }) {
  if (item.type === 'visit') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <Link href={`/profile/${item.username}`}>
            <UserAvatar url={item.avatar_url} username={item.username} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap text-sm">
              <Link href={`/profile/${item.username}`} className="font-semibold text-gray-900 hover:text-emerald-600">
                @{item.username}
              </Link>
              <span className="text-gray-500">visited</span>
              <Link href={`/parks/${item.park_code}`} className="font-medium text-emerald-700 hover:underline truncate">
                {item.park_name}
              </Link>
            </div>
            <p className="text-xs text-gray-400">{format(new Date(item.visited_date), 'MMMM d, yyyy')}</p>
          </div>
          <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
        {item.title && <p className="text-sm font-medium text-gray-800">{item.title}</p>}
        {item.notes && <p className="text-sm text-gray-600 line-clamp-3">{item.notes}</p>}
        {item.photos && item.photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {item.photos.map((url, i) => (
              <img key={i} src={url} alt="visit photo" className="w-24 h-24 rounded-lg object-cover border border-gray-100" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const tier = TIER_CONFIG[item.badge_tier as keyof typeof TIER_CONFIG];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <Link href={`/profile/${item.username}`}>
        <UserAvatar url={item.avatar_url} username={item.username} />
      </Link>
      <div className="flex-1 min-w-0 text-sm">
        <div className="flex items-center gap-1 flex-wrap">
          <Link href={`/profile/${item.username}`} className="font-semibold text-gray-900 hover:text-emerald-600">
            @{item.username}
          </Link>
          <span className="text-gray-500">earned the</span>
          <span className={`font-semibold ${tier?.labelColor ?? 'text-gray-700'}`}>{item.badge_name}</span>
          <span className="text-gray-500">badge</span>
          <span className="text-lg">{item.badge_emoji}</span>
        </div>
        <p className="text-xs text-gray-400">{format(new Date(item.earned_at), 'MMMM d, yyyy')}</p>
      </div>
      {tier && (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ background: tier.cssGradient }}
        >
          {item.badge_emoji}
        </div>
      )}
    </div>
  );
}
