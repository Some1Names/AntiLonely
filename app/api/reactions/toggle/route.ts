import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { isSameOriginMutationRequest } from '@/lib/reaction-helpers';
import { toggleMessageReaction } from '@/lib/reaction-service';

export async function POST(request: NextRequest) {
  if (
    !isSameOriginMutationRequest({
      originHeader: request.headers.get('origin'),
      hostHeader: request.headers.get('host'),
      forwardedHostHeader: request.headers.get('x-forwarded-host'),
    })
  ) {
    return NextResponse.json(
      { ok: false, error: 'คำขอไม่ได้มาจากโดเมนที่อนุญาต' },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const { roomId, postId, messageId, emoji, active } = body as {
    roomId?: unknown;
    postId?: unknown;
    messageId?: unknown;
    emoji?: unknown;
    active?: unknown;
  };

  if (
    typeof roomId !== 'string' ||
    typeof emoji !== 'string' ||
    (postId !== undefined && typeof postId !== 'string') ||
    (messageId !== undefined && typeof messageId !== 'string') ||
    (active !== undefined && typeof active !== 'boolean')
  ) {
    return NextResponse.json(
      { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const resolvedMessageId =
    typeof messageId === 'string' ? messageId : (postId ?? '');

  try {
    const result = await toggleMessageReaction({
      roomId,
      postId,
      messageId: resolvedMessageId,
      emoji,
      active,
      headers: request.headers,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }

    // In a Route Handler, revalidatePath only marks paths stale for future visits
    // without blocking this response with a full RSC re-render.
    try {
      revalidatePath(`/rooms/${result.data.roomSlug}`);
      revalidatePath(`/rooms/${result.data.roomId}`);
      if (postId !== undefined) {
        revalidatePath(`/rooms/${result.data.roomSlug}/posts/${result.data.postId}`);
        revalidatePath(`/rooms/${result.data.roomId}/posts/${result.data.postId}`);
      }
    } catch {
      // Ignore revalidation errors so the reaction update always returns quickly.
    }

    return NextResponse.json({
      ok: true,
      data: {
        messageId: result.data.messageId,
        reactions: result.data.reactions,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'ไม่สามารถอัปเดตรีแอคชันได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
