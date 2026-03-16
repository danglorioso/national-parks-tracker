import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { visits, parks, userBadges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ALL_BADGES, computeStats } from '@/lib/badges';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [userVisits, allParks, alreadyEarned] = await Promise.all([
      db.select({ park_code: visits.park_code, is_bucket_list: visits.is_bucket_list, visited_date: visits.visited_date })
        .from(visits)
        .where(eq(visits.clerk_user_id, userId)),
      db.select({ park_code: parks.park_code, states: parks.states }).from(parks),
      db.select({ badge_id: userBadges.badge_id, earned_at: userBadges.earned_at })
        .from(userBadges)
        .where(eq(userBadges.clerk_user_id, userId)),
    ]);

    const stats = computeStats(userVisits, allParks);

    const earnedIds = new Set(alreadyEarned.map(b => b.badge_id));
    const newlyEarned = ALL_BADGES.filter(b => !earnedIds.has(b.id) && b.criteria(stats));

    if (newlyEarned.length > 0) {
      await db.insert(userBadges).values(
        newlyEarned.map(b => ({ clerk_user_id: userId, badge_id: b.id }))
      );
    }

    const now = new Date().toISOString();
    const earnedMap = new Map<string, string>([
      ...alreadyEarned.map(b => [b.badge_id, b.earned_at.toISOString()] as [string, string]),
      ...newlyEarned.map(b => [b.id, now] as [string, string]),
    ]);

    return NextResponse.json({ stats, earned: Object.fromEntries(earnedMap) });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
