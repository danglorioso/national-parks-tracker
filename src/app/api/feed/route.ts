import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { follows, visits, userBadges, parks, userProfiles } from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { ALL_BADGES } from '@/lib/badges';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  // Get all users this person follows
  const followingRows = await db
    .select({ following_id: follows.following_id })
    .from(follows)
    .where(eq(follows.follower_id, userId));

  if (followingRows.length === 0) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  const followingIds = followingRows.map(r => r.following_id);

  // Determine mutual follows (for 'friends' visibility)
  const reverseFollows = await db
    .select({ follower_id: follows.follower_id })
    .from(follows)
    .where(and(inArray(follows.follower_id, followingIds), eq(follows.following_id, userId)));

  const mutualIds = new Set(reverseFollows.map(r => r.follower_id));

  // Fetch profiles + Clerk avatars
  const profiles = await db
    .select({ clerk_user_id: userProfiles.clerk_user_id, username: userProfiles.username })
    .from(userProfiles)
    .where(inArray(userProfiles.clerk_user_id, followingIds));

  const profileMap = new Map(profiles.map(p => [p.clerk_user_id, p.username]));

  // Fetch avatars from Clerk
  const avatarMap = new Map<string, string>();
  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ userId: followingIds, limit: 100 });
    clerkUsers.data.forEach(u => { avatarMap.set(u.id, u.imageUrl); });
  } catch {
    // non-critical
  }

  // Fetch visits from followees (public always; friends if mutual)
  const visitItems: Array<{
    type: 'visit';
    sort_date: Date;
    user_id: string;
    username: string;
    avatar_url: string | null;
    park_name: string;
    park_code: string;
    visited_date: Date;
    title: string | null;
    notes: string | null;
    photos: unknown;
    visibility: string | null;
  }> = [];

  // We fetch all matching visits and filter by visibility/mutual in JS
  const allVisits = await db
    .select({
      clerk_user_id: visits.clerk_user_id,
      park_code: visits.park_code,
      park_name: parks.name,
      visited_date: visits.visited_date,
      title: visits.title,
      notes: visits.notes,
      photos: visits.photos,
      visibility: visits.visibility,
    })
    .from(visits)
    .innerJoin(parks, eq(visits.park_code, parks.park_code))
    .where(
      and(
        inArray(visits.clerk_user_id, followingIds),
        eq(visits.is_bucket_list, false),
        or(
          eq(visits.visibility, 'public'),
          eq(visits.visibility, 'friends')
        )
      )
    );

  for (const v of allVisits) {
    if (v.visibility === 'friends' && !mutualIds.has(v.clerk_user_id)) continue;
    if (!profileMap.has(v.clerk_user_id)) continue;
    visitItems.push({
      type: 'visit',
      sort_date: v.visited_date,
      user_id: v.clerk_user_id,
      username: profileMap.get(v.clerk_user_id)!,
      avatar_url: avatarMap.get(v.clerk_user_id) ?? null,
      park_name: v.park_name,
      park_code: v.park_code,
      visited_date: v.visited_date,
      title: v.title,
      notes: v.notes,
      photos: v.photos,
      visibility: v.visibility,
    });
  }

  // Fetch badge events from followees
  const badgeRows = await db
    .select({
      clerk_user_id: userBadges.clerk_user_id,
      badge_id: userBadges.badge_id,
      earned_at: userBadges.earned_at,
    })
    .from(userBadges)
    .where(inArray(userBadges.clerk_user_id, followingIds));

  const badgeMap = new Map(ALL_BADGES.map(b => [b.id, b]));

  const badgeItems: Array<{
    type: 'badge';
    sort_date: Date;
    user_id: string;
    username: string;
    avatar_url: string | null;
    badge_id: string;
    badge_name: string;
    badge_emoji: string;
    badge_tier: string;
    earned_at: Date;
  }> = [];

  for (const b of badgeRows) {
    if (!profileMap.has(b.clerk_user_id)) continue;
    const def = badgeMap.get(b.badge_id);
    if (!def) continue;
    badgeItems.push({
      type: 'badge',
      sort_date: b.earned_at,
      user_id: b.clerk_user_id,
      username: profileMap.get(b.clerk_user_id)!,
      avatar_url: avatarMap.get(b.clerk_user_id) ?? null,
      badge_id: b.badge_id,
      badge_name: def.name,
      badge_emoji: def.emoji,
      badge_tier: def.tier,
      earned_at: b.earned_at,
    });
  }

  // Merge, sort by date desc, paginate
  const all = [...visitItems, ...badgeItems].sort(
    (a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime()
  );

  const page = all.slice(offset, offset + PAGE_SIZE);

  // Strip sort_date from response
  const items = page.map(({ sort_date: _, ...rest }) => rest);

  return NextResponse.json({ items, hasMore: all.length > offset + PAGE_SIZE });
}
