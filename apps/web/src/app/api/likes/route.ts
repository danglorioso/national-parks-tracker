import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { likes } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 });

    await db
      .insert(likes)
      .values({ user_id: userId, post_id: Number(postId) })
      .onConflictDoNothing();

    return NextResponse.json({ message: 'Liked' });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 });

    await db
      .delete(likes)
      .where(and(eq(likes.user_id, userId), eq(likes.post_id, Number(postId))));

    return NextResponse.json({ message: 'Unliked' });
  } catch (error) {
    console.error('Error unliking post:', error);
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
  }
}
