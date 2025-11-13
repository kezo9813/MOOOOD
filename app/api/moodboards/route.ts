import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { moodboardSchema } from '@/lib/validators';
import { orderByColor, orderBySemantic } from '@/lib/reco';
import { rgbToHsv } from '@/lib/colors';

export async function GET() {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const moodboards = await prisma.moodboard.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ moodboards });
}

export async function POST(request: Request) {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await request.json();
  const parsed = moodboardSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  if (parsed.data.source === 'folder' && !parsed.data.ids.length) {
    return NextResponse.json({ error: 'Missing folder id' }, { status: 400 });
  }

  let images: any[] = [];
  if (parsed.data.source === 'folder') {
    images = await prisma.imageAsset.findMany({
      where: { userId: user.id, imageFolders: { some: { folderId: parsed.data.ids[0] } } },
      include: { embedding: true }
    });
  } else {
    const fetched = await prisma.imageAsset.findMany({
      where: { userId: user.id, id: { in: parsed.data.ids } },
      include: { embedding: true }
    });
    images = parsed.data.ids
      .map((id) => fetched.find((img) => img.id === id))
      .filter(Boolean) as typeof fetched;
  }
  if (!images.length) {
    return NextResponse.json({ error: 'No images available' }, { status: 400 });
  }
  let ordered = images;
  if (parsed.data.strategy === 'color') {
    // Sorts by HSV proximity to keep "color adjacency" heuristics deterministic.
    ordered = orderByColor(
      images.map((img) => ({
        ...img,
        hsv: img.colorDominant
          ? rgbToHsv(
              parseInt(img.colorDominant.slice(1, 3), 16),
              parseInt(img.colorDominant.slice(3, 5), 16),
              parseInt(img.colorDominant.slice(5, 7), 16)
            )
          : undefined
      }))
    ) as any;
  }
  if (parsed.data.strategy === 'semantic' && parsed.data.prompt) {
    // Semantic ordering mirrors the embeddings that will later power recommendations.
    ordered = await orderBySemantic(
      images.map((img) => ({ ...img, embedding: img.embedding?.vector as unknown as number[] | undefined })),
      parsed.data.prompt
    ) as any;
  }
  const layout = ordered.map((img, idx) => ({
    imageId: img.id,
    x: idx % 4,
    y: Math.floor(idx / 4),
    scale: 1,
    z: idx
  }));
  const moodboard = await prisma.moodboard.create({
    data: {
      userId: user.id,
      title: parsed.data.prompt?.slice(0, 40) || 'Moodboard',
      prompt: parsed.data.prompt,
      imageIds: ordered.map((img) => img.id),
      layoutJson: JSON.stringify(layout)
    }
  });
  return NextResponse.json(moodboard);
}
