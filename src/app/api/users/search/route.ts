import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json([]);

  const rows = await db
    .select({ clerk_user_id: userProfiles.clerk_user_id, username: userProfiles.username })
    .from(userProfiles)
    .where(ilike(userProfiles.username, `%${q}%`))
    .limit(8);

  // Fetch names + avatars from Clerk
  const client = await clerkClient();
  const results = await Promise.all(
    rows.map(async (row) => {
      try {
        const user = await client.users.getUser(row.clerk_user_id);
        const parts = [user.firstName, user.lastName].filter(Boolean);
        return {
          username: row.username,
          full_name: parts.length > 0 ? parts.join(' ') : null,
          avatar_url: user.imageUrl ?? null,
          is_self: row.clerk_user_id === userId,
        };
      } catch {
        return { username: row.username, full_name: null, avatar_url: null, is_self: false };
      }
    })
  );

  return NextResponse.json(results);
}
