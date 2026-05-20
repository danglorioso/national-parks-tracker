import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const commentId = Number(id);
    if (isNaN(commentId)) return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });

    const deleted = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.user_id, userId)))
      .returning();

    if (deleted.length === 0) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
