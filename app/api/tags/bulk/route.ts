import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bulkTagSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await request.json();
  const parsed = bulkTagSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const image = await prisma.imageAsset.findFirst({ where: { id: parsed.data.imageId, userId: user.id } });
  if (!image) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const normalized = Array.from(new Set(parsed.data.tags.map((t) => t.trim().toLowerCase())));
  const attachedTagIds: number[] = [];
  for (const tagName of normalized) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: tagName } },
      create: { userId: user.id, name: tagName },
      update: {}
    });
    attachedTagIds.push(tag.id);
    await prisma.imageTag.upsert({
      where: { imageId_tagId: { imageId: parsed.data.imageId, tagId: tag.id } },
      create: { imageId: parsed.data.imageId, tagId: tag.id },
      update: {}
    });
  }
  await prisma.imageTag.deleteMany({
    where: {
      imageId: parsed.data.imageId,
      ...(attachedTagIds.length ? { tagId: { notIn: attachedTagIds } } : {})
    }
  });
  return NextResponse.json({ ok: true });
}
