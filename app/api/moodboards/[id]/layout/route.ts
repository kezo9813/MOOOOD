import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { moodboardLayoutSchema } from '@/lib/validators';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await request.json();
  const parsed = moodboardLayoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const existing = await prisma.moodboard.findFirst({ where: { id: Number(params.id), userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await prisma.moodboard.update({
    where: { id: existing.id },
    data: { layoutJson: parsed.data.layoutJson }
  });
  return NextResponse.json({ ok: true });
}
