import { NextResponse } from 'next/server';

// In-memory storage for demo purposes
const notesStore = new Map<string, { content: string; updatedAt: string }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  const notes = notesStore.get(userId);
  
  if (!notes) {
    return NextResponse.json({ content: '', updatedAt: null });
  }

  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, content } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const updatedAt = new Date().toISOString();
    notesStore.set(userId, { content, updatedAt });

    return NextResponse.json({
      success: true,
      savedAt: updatedAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save notes' },
      { status: 500 }
    );
  }
}
