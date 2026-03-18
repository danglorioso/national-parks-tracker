import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { visits, userProfiles, parks } from '@/lib/db/schema';
import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'alltime'; // 'alltime' | 'lastyear'

  const dateFilter = period === 'lastyear'
    ? gte(visits.visited_date, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    : undefined;

  const baseWhere = dateFilter
    ? and(eq(visits.is_bucket_list, false), dateFilter)
    : eq(visits.is_bucket_list, false);

  // Top 10 users by visit count
  const visitCountRows = await db
    .select({
      clerk_user_id: visits.clerk_user_id,
      visit_count: sql<number>`cast(count(*) as int)`,
    })
    .from(visits)
    .where(baseWhere)
    .groupBy(visits.clerk_user_id)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const topUserIds = visitCountRows.map(r => r.clerk_user_id);

  const [profileRows, avatarMap] = await Promise.all([
    topUserIds.length > 0
      ? db.select({ clerk_user_id: userProfiles.clerk_user_id, username: userProfiles.username })
          .from(userProfiles)
          .where(inArray(userProfiles.clerk_user_id, topUserIds))
      : Promise.resolve([]),
    (async () => {
      const map = new Map<string, string>();
      if (topUserIds.length === 0) return map;
      try {
        const client = await clerkClient();
        const clerkUsers = await client.users.getUserList({ userId: topUserIds, limit: 20 });
        clerkUsers.data.forEach(u => map.set(u.id, u.imageUrl));
      } catch { /* non-critical */ }
      return map;
    })(),
  ]);

  const profileMap = new Map(profileRows.map(p => [p.clerk_user_id, p.username]));

  const users = visitCountRows
    .filter(r => profileMap.has(r.clerk_user_id))
    .map((r, i) => ({
      rank: i + 1,
      clerk_user_id: r.clerk_user_id,
      username: profileMap.get(r.clerk_user_id)!,
      avatar_url: avatarMap.get(r.clerk_user_id) ?? null,
      visit_count: r.visit_count,
    }));

  // Top 5 most visited parks (public visits only)
  const publicParksWhere = dateFilter
    ? and(eq(visits.is_bucket_list, false), eq(visits.visibility, 'public'), dateFilter)
    : and(eq(visits.is_bucket_list, false), eq(visits.visibility, 'public'));

  const topParks = await db
    .select({
      park_code: visits.park_code,
      park_name: parks.name,
      visit_count: sql<number>`cast(count(*) as int)`,
    })
    .from(visits)
    .innerJoin(parks, eq(visits.park_code, parks.park_code))
    .where(publicParksWhere)
    .groupBy(visits.park_code, parks.name)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  return NextResponse.json({ users, topParks });
}
