import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles, visits, follows } from '@/lib/db/schema';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: viewerId } = await auth();
    const { userId } = await params;

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerk_user_id, userId))
      .limit(1);

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [[visitStats], [followerCount], [followingCount]] = await Promise.all([
      db
        .select({ count: count() })
        .from(visits)
        .where(sql`${visits.clerk_user_id} = ${userId} AND ${visits.is_bucket_list} = false AND ${visits.visited_date} IS NOT NULL`),
      db.select({ count: count() }).from(follows).where(eq(follows.following_id, userId)),
      db.select({ count: count() }).from(follows).where(eq(follows.follower_id, userId)),
    ]);

    const isFollowing = viewerId
      ? (await db
          .select()
          .from(follows)
          .where(sql`${follows.follower_id} = ${viewerId} AND ${follows.following_id} = ${userId}`)
          .limit(1)).length > 0
      : false;

    return NextResponse.json({
      ...profile,
      parks_visited: visitStats.count,
      follower_count: followerCount.count,
      following_count: followingCount.count,
      is_following: isFollowing,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
