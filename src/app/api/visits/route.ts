import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visits } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Get Clerk signed-in user ID
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all visits for the current user
    const userVisits = await db
      .select({
        park_code: visits.park_code,
        visited_date: visits.visited_date,
        is_bucket_list: visits.is_bucket_list,
      })
      .from(visits)
      .where(eq(visits.clerk_user_id, userId));

    return NextResponse.json(userVisits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get Clerk signed-in user ID
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { park_code, is_bucket_list } = body;

    if (!park_code) {
      return NextResponse.json(
        { error: 'Park code is required' },
        { status: 400 }
      );
    }

    const isBucketList = is_bucket_list === true;

    // Check if visit already exists
    const existingVisit = await db
      .select()
      .from(visits)
      .where(
        and(
          eq(visits.clerk_user_id, userId),
          eq(visits.park_code, park_code)
        )
      )
      .limit(1);

    if (existingVisit.length > 0) {
      // Visit already exists, update it if needed
      const existing = existingVisit[0];
      if (isBucketList && !existing.is_bucket_list) {
        // Update to bucket list
        const updated = await db
          .update(visits)
          .set({ 
            is_bucket_list: true,
            visited_date: null as unknown as Date
          })
          .where(eq(visits.id, existing.id))
          .returning();
        return NextResponse.json({ 
          message: 'Park added to bucket list',
          visit: updated[0]
        });
      }
      // Visit already exists, return success
      return NextResponse.json({ 
        message: isBucketList ? 'Park already in bucket list' : 'Park already marked as visited',
        visit: existing
      });
    }

    // Create new visit
    const newVisit = await db
      .insert(visits)
      .values({
        clerk_user_id: userId,
        park_code: park_code,
        visited_date: isBucketList ? null as any : new Date(),
        is_bucket_list: isBucketList,
      })
      .returning();

    return NextResponse.json({ 
      message: isBucketList ? 'Park added to bucket list' : 'Park marked as visited',
      visit: newVisit[0]
    });
  } catch (error) {
    console.error('Error marking park as visited:', error);
    return NextResponse.json(
      { error: 'Failed to mark park as visited' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get Clerk signed-in user ID
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const park_code = searchParams.get('park_code');

    if (!park_code) {
      return NextResponse.json(
        { error: 'Park code is required' },
        { status: 400 }
      );
    }

    // Delete the visit record
    await db
      .delete(visits)
      .where(
        and(
          eq(visits.clerk_user_id, userId),
          eq(visits.park_code, park_code)
        )
      );

    return NextResponse.json({ 
      message: 'Visit removed successfully'
    });
  } catch (error) {
    console.error('Error removing visit:', error);
    return NextResponse.json(
      { error: 'Failed to remove visit' },
      { status: 500 }
    );
  }
}

