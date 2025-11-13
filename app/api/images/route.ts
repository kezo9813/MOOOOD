import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit')) || 20;
  const cursor = searchParams.get('cursor');
  const folderId = searchParams.get('folderId');
  const tag = searchParams.get('tag');
  const query = searchParams.get('q');

  const where: Prisma.ImageAssetWhereInput = { userId: user.id };
  if (folderId) {
    where.imageFolders = { some: { folderId: Number(folderId) } };
  }
  if (query) {
    where.OR = [
      { caption: { contains: query, mode: 'insensitive' } },
      { imageTags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } }
    ];
  }
  if (tag) {
    where.imageTags = { some: { tag: { name: tag } } };
  }

  const images = await prisma.imageAsset.findMany({
    where,
    orderBy: { id: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: Number(cursor) } : undefined,
    skip: cursor ? 1 : 0,
    include: { imageTags: { include: { tag: true } }, imageFolders: true }
  });
  const hasNext = images.length > limit;
  const items = hasNext ? images.slice(0, -1) : images;
  return NextResponse.json({
    items,
    nextCursor: hasNext ? items[items.length - 1]?.id : null
  });
}
