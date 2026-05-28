import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visits } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userVisits = await db
      .select({
        id: visits.id,
        park_code: visits.park_code,
        visited_date: visits.visited_date,
        is_bucket_list: visits.is_bucket_list,
        title: visits.title,
        notes: visits.notes,
        photos: visits.photos,
        visibility: visits.visibility,
      })
      .from(visits)
      .where(eq(visits.clerk_user_id, userId));

    return NextResponse.json(userVisits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { park_code, is_bucket_list, visited_date, title, notes, photos, visibility } = body;

    if (!park_code) {
      return NextResponse.json({ error: 'Park code is required' }, { status: 400 });
    }

    const isBucketList = is_bucket_list === true;
    const visitDate = visited_date ? new Date(visited_date) : (isBucketList ? null : new Date());
    const visitVisibility = visibility || 'private';

    const existingVisit = await db
      .select()
      .from(visits)
      .where(and(eq(visits.clerk_user_id, userId), eq(visits.park_code, park_code)))
      .limit(1);

    if (existingVisit.length > 0) {
      const existing = existingVisit[0];
      if (isBucketList && !existing.is_bucket_list) {
        const updated = await db
          .update(visits)
          .set({ is_bucket_list: true, visited_date: null as unknown as Date })
          .where(eq(visits.id, existing.id))
          .returning();
        return NextResponse.json({ message: 'Park added to bucket list', visit: updated[0] });
      }
      if (!isBucketList) {
        const updated = await db
          .update(visits)
          .set({
            is_bucket_list: false,
            visited_date: visitDate as Date,
            title: title !== undefined ? title : existing.title,
            notes: notes !== undefined ? notes : existing.notes,
            photos: photos !== undefined ? photos : existing.photos,
            visibility: visitVisibility,
            updated_at: new Date(),
          })
          .where(eq(visits.id, existing.id))
          .returning();
        return NextResponse.json({
          message: existing.is_bucket_list ? 'Park marked as visited' : 'Visit updated',
          visit: updated[0],
        });
      }
      return NextResponse.json({ message: 'Park already in bucket list', visit: existing });
    }

    const newVisit = await db
      .insert(visits)
      .values({
        clerk_user_id: userId,
        park_code,
        visited_date: visitDate as any,
        is_bucket_list: isBucketList,
        title: title || null,
        notes: notes || null,
        photos: photos || null,
        visibility: isBucketList ? 'private' : visitVisibility,
      })
      .returning();

    return NextResponse.json({
      message: isBucketList ? 'Park added to bucket list' : 'Park marked as visited',
      visit: newVisit[0],
    });
  } catch (error) {
    console.error('Error marking park as visited:', error);
    return NextResponse.json({ error: 'Failed to mark park as visited' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const park_code = searchParams.get('park_code');

    if (!park_code) {
      return NextResponse.json({ error: 'Park code is required' }, { status: 400 });
    }

    await db
      .delete(visits)
      .where(and(eq(visits.clerk_user_id, userId), eq(visits.park_code, park_code)));

    return NextResponse.json({ message: 'Visit removed successfully' });
  } catch (error) {
    console.error('Error removing visit:', error);
    return NextResponse.json({ error: 'Failed to remove visit' }, { status: 500 });
  }
}
