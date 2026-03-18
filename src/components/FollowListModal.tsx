"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRound } from "lucide-react";
import Link from "next/link";

type Tab = "followers" | "following";

interface FollowUser {
  clerk_user_id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
}

interface FollowListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab: Tab;
  targetUserId: string;   // clerk_user_id of the profile being viewed
  viewerId: string;       // clerk_user_id of the logged-in viewer
  isOwnProfile: boolean;
  viewerFollowing: Set<string>; // clerk_user_ids the viewer already follows
  onFollow: (userId: string) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
}

export default function FollowListModal({
  open,
  onOpenChange,
  initialTab,
  targetUserId,
  viewerId,
  isOwnProfile,
  viewerFollowing,
  onFollow,
  onUnfollow,
}: FollowListModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [lists, setLists] = useState<{ followers: FollowUser[] | null; following: FollowUser[] | null }>({
    followers: null,
    following: null,
  });
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  // local mirror of follow state so buttons update immediately
  const [localFollowing, setLocalFollowing] = useState<Set<string>>(new Set());

  // Reset tab when opened
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setLocalFollowing(new Set(viewerFollowing));
    }
  }, [open, initialTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch whichever tab is active (cache the other)
  useEffect(() => {
    if (!open) return;
    if (lists[tab] !== null) return; // already loaded

    setLoading(true);
    fetch(`/api/follows?type=${tab}&user_id=${targetUserId}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: FollowUser[]) => {
        setLists(prev => ({ ...prev, [tab]: data }));
      })
      .catch(() => setLists(prev => ({ ...prev, [tab]: [] })))
      .finally(() => setLoading(false));
  }, [open, tab, targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFollow = async (userId: string) => {
    setPendingIds(prev => new Set([...prev, userId]));
    try {
      await onFollow(userId);
      setLocalFollowing(prev => new Set([...prev, userId]));
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
  };

  const handleUnfollow = async (userId: string) => {
    setPendingIds(prev => new Set([...prev, userId]));
    try {
      await onUnfollow(userId);
      setLocalFollowing(prev => { const s = new Set(prev); s.delete(userId); return s; });
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
  };

  const current = lists[tab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="sr-only">Followers &amp; Following</DialogTitle>
          {/* Tab bar */}
          <div className="flex border-b border-gray-200">
            {(["followers", "following"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[420px] px-2 py-2">
          {loading || current === null ? (
            <div className="space-y-1 px-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28 rounded" />
                    <Skeleton className="h-2.5 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : current.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              {tab === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          ) : (
            current.map(u => {
              const isSelf = u.clerk_user_id === viewerId;
              const isFollowing = localFollowing.has(u.clerk_user_id);
              const isPending = pendingIds.has(u.clerk_user_id);

              // On own followers tab: show "Remove" for each follower (to remove them)
              // On own following tab or other profile: show Follow/Following
              const isOwnFollowersTab = isOwnProfile && tab === "followers";

              return (
                <div key={u.clerk_user_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <Link href={`/profile/${u.username}`} onClick={() => onOpenChange(false)} className="shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <UserRound className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${u.username}`} onClick={() => onOpenChange(false)} className="block">
                      {u.full_name && (
                        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{u.full_name}</p>
                      )}
                      <p className={`truncate leading-tight ${u.full_name ? "text-xs text-gray-400" : "text-sm font-semibold text-gray-900"}`}>
                        @{u.username}
                      </p>
                    </Link>
                  </div>
                  {!isSelf && (
                    isOwnFollowersTab ? (
                      // Own followers tab — "Remove" to remove this follower
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleUnfollow(u.clerk_user_id)}
                        className="shrink-0 h-8 text-xs px-3"
                      >
                        Remove
                      </Button>
                    ) : (
                      // Following tab or other profile — Follow / Following toggle
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        disabled={isPending}
                        onClick={() => isFollowing ? handleUnfollow(u.clerk_user_id) : handleFollow(u.clerk_user_id)}
                        className={`shrink-0 h-8 text-xs px-3 ${!isFollowing ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
