import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { parks } from '@/lib/db/schema';
import { ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json([]);

  const rows = await db
    .select({ park_code: parks.park_code, name: parks.name, states: parks.states })
    .from(parks)
    .where(or(ilike(parks.name, `%${q}%`), ilike(parks.states, `%${q}%`)))
    .limit(6);

  return NextResponse.json(rows);
}
