import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { handleToggleReactionHttp } from '@/lib/reaction-helpers';
import { toggleMessageReaction } from '@/lib/reaction-service';

export async function POST(request: NextRequest) {
  const response = await handleToggleReactionHttp(request, {
    toggleReaction: toggleMessageReaction,
    revalidatePath,
  });

  return NextResponse.json(response.body, { status: response.status });
}
