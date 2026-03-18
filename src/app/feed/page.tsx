"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/NavBar";
import { TIER_CONFIG } from "@/lib/badges";
import { format } from "date-fns";
import { MapPin, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

interface Suggestion {
  clerk_user_id: string;
  username: string;
  avatar_url?: string;
}

function UserAvatar({ url, username }: { url: string | null; username: string }) {
  if (url) return <img src={url} alt={username} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
      <UserRound className="w-5 h-5 text-emerald-600" />
    </div>
  );
}

export default function FeedPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [totalParksCount, setTotalParksCount] = useState(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/');
  }, [isLoaded, isSignedIn, router]);

  const loadFeed = useCallback(async (currentOffset: number) => {
    const res = await fetch(`/api/feed?offset=${currentOffset}`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(prev => currentOffset === 0 ? data.items : [...prev, ...data.items]);
    setHasMore(data.hasMore);
    setOffset(currentOffset + data.items.length);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    setLoading(true);
    Promise.all([
      loadFeed(0),
      fetch('/api/parks').then(r => r.json()).then(d => setTotalParksCount(Array.isArray(d) ? d.length : 0)),
      // Fetch suggestions: users with profiles (simple: get a few profiles from the API)
      fetch('/api/follows?type=following').then(r => r.json()).then((followingList: Array<{ clerk_user_id: string }>) => {
        setFollowing(new Set(followingList.map((f) => f.clerk_user_id)));
      }),
    ]).finally(() => setLoading(false));
  }, [isSignedIn, loadFeed]);

  const handleFollow = async (userId: string, username: string) => {
    await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following_id: userId }),
    });
    setFollowing(prev => new Set([...prev, userId]));
    setSuggestions(prev => prev.filter(s => s.clerk_user_id !== userId));
    // Reload feed
    setItems([]);
    setOffset(0);
    loadFeed(0);
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Nav visitedParksCount={0} totalParksCount={totalParksCount} />

      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">Nothing here yet</p>
            <p className="text-sm text-gray-500">Follow other explorers to see their park visits and badge achievements here.</p>
            <Link href="/parks">
              <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">Explore parks</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <FeedCard key={idx} item={item} />
            ))}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => loadFeed(offset)}
              >
                Load more
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  if (item.type === 'visit') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <Link href={`/profile/${item.username}`}>
            <UserAvatar url={item.avatar_url} username={item.username} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm">
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

  // Badge item
  const tier = TIER_CONFIG[item.badge_tier as keyof typeof TIER_CONFIG];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <Link href={`/profile/${item.username}`}>
        <UserAvatar url={item.avatar_url} username={item.username} />
      </Link>
      <div className="flex-1 min-w-0 text-sm">
        <div className="flex items-center gap-1">
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
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br ${tier.gradient} shrink-0`}>
          {item.badge_emoji}
        </div>
      )}
    </div>
  );
}
