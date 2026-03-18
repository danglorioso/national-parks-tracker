"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/NavBar";
import { ALL_BADGES, TIER_CONFIG } from "@/lib/badges";
import { format } from "date-fns";
import { MapPin, Users, UserCheck, Lock, Globe, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  profile: {
    clerk_user_id: string;
    username: string;
    bio: string | null;
    avatar_url: string | null;
    follower_count: number;
    following_count: number;
    viewer_follows: boolean;
    is_own_profile: boolean;
  };
  visits: Array<{
    id: number;
    park_code: string;
    park_name: string;
    visited_date: string;
    title: string | null;
    notes: string | null;
    photos: string[] | null;
    visibility: string | null;
  }>;
  badges: Array<{ badge_id: string; earned_at: string }>;
}

const TABS = ['Visits', 'Badges'] as const;
type Tab = typeof TABS[number];

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
  public: <Globe className="w-3 h-3" />,
  friends: <UserCheck className="w-3 h-3" />,
  private: <Lock className="w-3 h-3" />,
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Visits');
  const [followLoading, setFollowLoading] = useState(false);
  const [totalParksCount, setTotalParksCount] = useState(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/');
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/users/${encodeURIComponent(username)}`).then(r => r.json()),
      fetch('/api/parks').then(r => r.json()),
    ]).then(([profileData, parksData]) => {
      if (profileData.error) { router.push('/feed'); return; }
      setData(profileData);
      setTotalParksCount(Array.isArray(parksData) ? parksData.length : 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [username, router]);

  const handleFollow = async () => {
    if (!data) return;
    setFollowLoading(true);
    try {
      if (data.profile.viewer_follows) {
        await fetch(`/api/follows?following_id=${data.profile.clerk_user_id}`, { method: 'DELETE' });
        setData(prev => prev ? {
          ...prev,
          profile: { ...prev.profile, viewer_follows: false, follower_count: prev.profile.follower_count - 1 }
        } : null);
      } else {
        await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: data.profile.clerk_user_id }),
        });
        setData(prev => prev ? {
          ...prev,
          profile: { ...prev.profile, viewer_follows: true, follower_count: prev.profile.follower_count + 1 }
        } : null);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const badgeMap = new Map(ALL_BADGES.map(b => [b.id, b]));
  const earnedBadgeIds = new Set(data?.badges.map(b => b.badge_id) ?? []);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Nav visitedParksCount={0} totalParksCount={0} />
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl bg-gray-200" />
          <Skeleton className="h-8 w-48 rounded-lg bg-gray-200" />
          <Skeleton className="h-64 w-full rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, visits, badges } = data;
  const visitedCount = visits.filter(v => !v.visited_date || true).length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Nav visitedParksCount={profile.is_own_profile ? visitedCount : 0} totalParksCount={totalParksCount} />

      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-16 h-16 rounded-full border-2 border-emerald-500 object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <UserRound className="w-8 h-8 text-emerald-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">@{profile.username}</h1>
                  {profile.bio && <p className="text-sm text-gray-600 mt-0.5">{profile.bio}</p>}
                </div>
                {!profile.is_own_profile && (
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
                {profile.is_own_profile && (
                  <Link href="/settings">
                    <Button variant="outline" size="sm">Edit profile</Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span><span className="font-semibold text-gray-900">{visits.length}</span> parks visited</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span><span className="font-semibold text-gray-900">{profile.follower_count}</span> followers</span>
                </div>
                <div>
                  <span><span className="font-semibold text-gray-900">{profile.following_count}</span> following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t} {t === 'Visits' && <span className="ml-1 text-xs text-gray-400">({visits.length})</span>}
              {t === 'Badges' && <span className="ml-1 text-xs text-gray-400">({badges.length})</span>}
            </button>
          ))}
        </div>

        {/* Visits tab */}
        {tab === 'Visits' && (
          <div className="space-y-3">
            {visits.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No public visits yet.
              </div>
            ) : (
              visits
                .slice()
                .sort((a, b) => new Date(b.visited_date).getTime() - new Date(a.visited_date).getTime())
                .map(v => (
                  <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/parks/${v.park_code}`} className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                          {v.park_name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(v.visited_date), 'MMMM d, yyyy')}</p>
                      </div>
                      {v.visibility && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          {VISIBILITY_ICONS[v.visibility]}
                          <span className="capitalize">{v.visibility}</span>
                        </span>
                      )}
                    </div>
                    {v.title && <p className="text-sm font-medium text-gray-800">{v.title}</p>}
                    {v.notes && <p className="text-sm text-gray-600 line-clamp-3">{v.notes}</p>}
                    {v.photos && v.photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {v.photos.map((url, i) => (
                          <img key={i} src={url} alt="visit photo" className="w-20 h-20 rounded-lg object-cover border border-gray-100" />
                        ))}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {/* Badges tab */}
        {tab === 'Badges' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_BADGES.filter(b => earnedBadgeIds.has(b.id)).map(badge => {
              const tier = TIER_CONFIG[badge.tier];
              const earned = data.badges.find(b => b.badge_id === badge.id);
              return (
                <div key={badge.id} className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-2 shadow-sm ${tier.ring} ring-1`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br ${tier.gradient}`}>
                    {badge.emoji}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">{badge.name}</p>
                    <p className={`text-xs font-medium ${tier.labelColor}`}>{tier.label}</p>
                    {earned && (
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(earned.earned_at), 'MMM yyyy')}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {badges.length === 0 && (
              <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No badges earned yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
