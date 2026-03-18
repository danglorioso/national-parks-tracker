import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { follows, userProfiles } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'followers' | 'following'
  const targetUser = searchParams.get('user_id') || userId;

  let rows: { clerk_user_id: string }[] = [];

  if (type === 'followers') {
    const followerRows = await db
      .select({ clerk_user_id: follows.follower_id })
      .from(follows)
      .where(eq(follows.following_id, targetUser));
    rows = followerRows;
  } else {
    const followingRows = await db
      .select({ clerk_user_id: follows.following_id })
      .from(follows)
      .where(eq(follows.follower_id, targetUser));
    rows = followingRows;
  }

  if (rows.length === 0) return NextResponse.json([]);

  const ids = rows.map(r => r.clerk_user_id);
  const profiles = await db
    .select({ clerk_user_id: userProfiles.clerk_user_id, username: userProfiles.username })
    .from(userProfiles)
    .where(inArray(userProfiles.clerk_user_id, ids));

  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { following_id } = await request.json();
  if (!following_id) return NextResponse.json({ error: 'following_id is required' }, { status: 400 });
  if (following_id === userId) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

  // Verify target has a profile
  const [target] = await db
    .select({ clerk_user_id: userProfiles.clerk_user_id })
    .from(userProfiles)
    .where(eq(userProfiles.clerk_user_id, following_id))
    .limit(1);

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await db
    .insert(follows)
    .values({ follower_id: userId, following_id })
    .onConflictDoNothing();

  return NextResponse.json({ message: 'Following' });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const following_id = searchParams.get('following_id');
  if (!following_id) return NextResponse.json({ error: 'following_id is required' }, { status: 400 });

  await db
    .delete(follows)
    .where(and(eq(follows.follower_id, userId), eq(follows.following_id, following_id)));

  return NextResponse.json({ message: 'Unfollowed' });
}
