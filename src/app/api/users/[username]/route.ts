import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userProfiles, visits, userBadges, parks, follows } from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { userId: viewerId } = await auth();

  // Find profile
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.username, username.toLowerCase()))
    .limit(1);

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ownerId = profile.clerk_user_id;

  // Get follower/following counts
  const [followerRows, followingRows] = await Promise.all([
    db.select({ id: follows.id }).from(follows).where(eq(follows.following_id, ownerId)),
    db.select({ id: follows.id }).from(follows).where(eq(follows.follower_id, ownerId)),
  ]);

  // Determine if viewer follows owner and vice versa (mutual = friends)
  let viewerFollowsOwner = false;
  let ownerFollowsViewer = false;
  let isOwnProfile = false;

  if (viewerId) {
    isOwnProfile = viewerId === ownerId;
    if (!isOwnProfile) {
      const [vfo, ofv] = await Promise.all([
        db.select({ id: follows.id }).from(follows).where(
          and(eq(follows.follower_id, viewerId), eq(follows.following_id, ownerId))
        ).limit(1),
        db.select({ id: follows.id }).from(follows).where(
          and(eq(follows.follower_id, ownerId), eq(follows.following_id, viewerId))
        ).limit(1),
      ]);
      viewerFollowsOwner = vfo.length > 0;
      ownerFollowsViewer = ofv.length > 0;
    }
  }

  const isMutual = viewerFollowsOwner && ownerFollowsViewer;

  // Determine which visits to return
  let visibilityFilter;
  if (isOwnProfile) {
    // Own profile: see all visits
    visibilityFilter = undefined;
  } else if (isMutual) {
    visibilityFilter = or(
      eq(visits.visibility, 'public'),
      eq(visits.visibility, 'friends')
    );
  } else {
    visibilityFilter = eq(visits.visibility, 'public');
  }

  const visitQuery = db
    .select({
      id: visits.id,
      park_code: visits.park_code,
      park_name: parks.name,
      visited_date: visits.visited_date,
      title: visits.title,
      notes: visits.notes,
      photos: visits.photos,
      visibility: visits.visibility,
      is_bucket_list: visits.is_bucket_list,
    })
    .from(visits)
    .innerJoin(parks, eq(visits.park_code, parks.park_code))
    .where(
      visibilityFilter
        ? and(eq(visits.clerk_user_id, ownerId), eq(visits.is_bucket_list, false), visibilityFilter)
        : and(eq(visits.clerk_user_id, ownerId), eq(visits.is_bucket_list, false))
    );

  const [userVisits, badges] = await Promise.all([
    visitQuery,
    db.select().from(userBadges).where(eq(userBadges.clerk_user_id, ownerId)),
  ]);

  // Fetch Clerk avatar + name
  let avatarUrl: string | null = null;
  let fullName: string | null = null;
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(ownerId);
    avatarUrl = clerkUser.imageUrl ?? null;
    const parts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
    fullName = parts.length > 0 ? parts.join(' ') : null;
  } catch {
    // non-critical
  }

  return NextResponse.json({
    profile: {
      ...profile,
      avatar_url: avatarUrl,
      full_name: fullName,
      follower_count: followerRows.length,
      following_count: followingRows.length,
      viewer_follows: viewerFollowsOwner,
      is_own_profile: isOwnProfile,
    },
    visits: userVisits,
    badges,
  });
}
