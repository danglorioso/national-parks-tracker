import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { follows, visits, userBadges, parks, userProfiles } from '@/lib/db/schema';
import { eq, and, or, inArray, ne } from 'drizzle-orm';
import { ALL_BADGES } from '@/lib/badges';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const mode = searchParams.get('mode') ?? 'friends'; // 'friends' | 'explore'

  if (mode === 'explore') {
    return getExploreFeed(userId, offset);
  }
  return getFriendsFeed(userId, offset);
}

// ── Friends feed (followees only) ─────────────────────────────────────────────

async function getFriendsFeed(userId: string, offset: number) {
  const followingRows = await db
    .select({ following_id: follows.following_id })
    .from(follows)
    .where(eq(follows.follower_id, userId));

  if (followingRows.length === 0) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  const followingIds = followingRows.map(r => r.following_id);

  const reverseFollows = await db
    .select({ follower_id: follows.follower_id })
    .from(follows)
    .where(and(inArray(follows.follower_id, followingIds), eq(follows.following_id, userId)));

  const mutualIds = new Set(reverseFollows.map(r => r.follower_id));

  const profiles = await db
    .select({ clerk_user_id: userProfiles.clerk_user_id, username: userProfiles.username })
    .from(userProfiles)
    .where(inArray(userProfiles.clerk_user_id, followingIds));

  const profileMap = new Map(profiles.map(p => [p.clerk_user_id, p.username]));
  const avatarMap = await fetchAvatars(followingIds);

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
        or(eq(visits.visibility, 'public'), eq(visits.visibility, 'friends'))
      )
    );

  const visitItems = allVisits
    .filter(v => profileMap.has(v.clerk_user_id) && (v.visibility !== 'friends' || mutualIds.has(v.clerk_user_id)))
    .map(v => ({
      type: 'visit' as const,
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
    }));

  const badgeRows = await db
    .select({ clerk_user_id: userBadges.clerk_user_id, badge_id: userBadges.badge_id, earned_at: userBadges.earned_at })
    .from(userBadges)
    .where(inArray(userBadges.clerk_user_id, followingIds));

  const badgeItems = buildBadgeItems(badgeRows, profileMap, avatarMap);

  return paginateAndRespond([...visitItems, ...badgeItems], offset);
}

// ── Explore feed (all public users) ───────────────────────────────────────────

async function getExploreFeed(userId: string, offset: number) {
  const [allProfiles, allVisitRows, allBadgeRows] = await Promise.all([
    db.select({ clerk_user_id: userProfiles.clerk_user_id, username: userProfiles.username })
      .from(userProfiles)
      .where(ne(userProfiles.clerk_user_id, userId)),
    db.select({
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
      .where(and(eq(visits.is_bucket_list, false), eq(visits.visibility, 'public'), ne(visits.clerk_user_id, userId))),
    db.select({ clerk_user_id: userBadges.clerk_user_id, badge_id: userBadges.badge_id, earned_at: userBadges.earned_at })
      .from(userBadges)
      .where(ne(userBadges.clerk_user_id, userId)),
  ]);

  const profileMap = new Map(allProfiles.map(p => [p.clerk_user_id, p.username]));
  const allIds = allProfiles.map(p => p.clerk_user_id);
  const avatarMap = await fetchAvatars(allIds);

  const visitItems = allVisitRows
    .filter(v => profileMap.has(v.clerk_user_id))
    .map(v => ({
      type: 'visit' as const,
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
    }));

  const badgeItems = buildBadgeItems(allBadgeRows, profileMap, avatarMap);

  return paginateAndRespond([...visitItems, ...badgeItems], offset);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchAvatars(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;
  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ userId: userIds, limit: 100 });
    clerkUsers.data.forEach(u => map.set(u.id, u.imageUrl));
  } catch { /* non-critical */ }
  return map;
}

type BadgeItemResult = {
  type: 'badge';
  sort_date: Date;
  user_id: string;
  username: string;
  avatar_url: string | null;
  badge_id: string;
  badge_name: string;
  badge_emoji: string;
  badge_tier: string; // kept as string in response
  earned_at: Date;
};

function buildBadgeItems(
  rows: { clerk_user_id: string; badge_id: string; earned_at: Date }[],
  profileMap: Map<string, string>,
  avatarMap: Map<string, string>,
): BadgeItemResult[] {
  const badgeMap = new Map(ALL_BADGES.map(b => [b.id, b]));
  return rows
    .filter(b => profileMap.has(b.clerk_user_id))
    .map(b => {
      const def = badgeMap.get(b.badge_id);
      if (!def) return null;
      return {
        type: 'badge' as const,
        sort_date: b.earned_at,
        user_id: b.clerk_user_id,
        username: profileMap.get(b.clerk_user_id)!,
        avatar_url: avatarMap.get(b.clerk_user_id) ?? null,
        badge_id: b.badge_id,
        badge_name: def.name,
        badge_emoji: def.emoji,
        badge_tier: def.tier as string,
        earned_at: b.earned_at,
      } satisfies BadgeItemResult;
    })
    .filter((x): x is BadgeItemResult => x !== null);
}

function paginateAndRespond(
  allItems: Array<{ sort_date: Date; [key: string]: unknown }>,
  offset: number,
) {
  const sorted = allItems.sort((a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime());
  const page = sorted.slice(offset, offset + PAGE_SIZE);
  const items = page.map(({ sort_date: _, ...rest }) => rest);
  return NextResponse.json({ items, hasMore: sorted.length > offset + PAGE_SIZE });
}
