import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userProfiles, visits, parks } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerk_user_id, userId))
    .limit(1);

  if (profile.length === 0) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const [visitedCountRow, totalParksCountRow] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(visits)
      .where(and(eq(visits.clerk_user_id, userId), eq(visits.is_bucket_list, false))),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(parks),
  ]);

  return NextResponse.json({
    ...profile[0],
    visited_count: visitedCountRow[0]?.count ?? 0,
    total_parks_count: totalParksCountRow[0]?.count ?? 0,
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, bio } = await request.json();

  if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });

  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    return NextResponse.json(
      { error: 'Username must be 3–20 characters: letters, numbers, and underscores only' },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await db
    .select({ clerk_user_id: userProfiles.clerk_user_id })
    .from(userProfiles)
    .where(eq(userProfiles.username, normalized))
    .limit(1);

  if (existing.length > 0 && existing[0].clerk_user_id !== userId) {
    return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
  }

  const [profile] = await db
    .insert(userProfiles)
    .values({ clerk_user_id: userId, username: normalized, bio: bio || null })
    .onConflictDoUpdate({
      target: userProfiles.clerk_user_id,
      set: { username: normalized, bio: bio || null, updated_at: new Date() },
    })
    .returning();

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, bio } = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date() };

  if (username !== undefined) {
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      return NextResponse.json(
        { error: 'Username must be 3–20 characters: letters, numbers, and underscores only' },
        { status: 400 }
      );
    }
    const existing = await db
      .select({ clerk_user_id: userProfiles.clerk_user_id })
      .from(userProfiles)
      .where(eq(userProfiles.username, normalized))
      .limit(1);

    if (existing.length > 0 && existing[0].clerk_user_id !== userId) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }
    updates.username = normalized;
  }

  if (bio !== undefined) updates.bio = bio;

  const [updated] = await db
    .update(userProfiles)
    .set(updates)
    .where(eq(userProfiles.clerk_user_id, userId))
    .returning();

  return NextResponse.json(updated);
}
