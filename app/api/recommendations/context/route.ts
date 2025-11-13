import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recommendationSchema } from '@/lib/validators';
import { recommendContext } from '@/lib/reco';

export async function GET(request: Request) {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const parsed = recommendationSchema.safeParse({ scope: searchParams.get('scope'), id: searchParams.get('id') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const images = await recommendContext(user.id, parsed.data.scope, parsed.data.id);
  return NextResponse.json({ images });
}
