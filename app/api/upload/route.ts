import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadSchema } from '@/lib/validators';
import { storeImageFile } from '@/lib/storage';
import { computeDominantColor } from '@/lib/colors';
import sharp from 'sharp';
import { autoCaptionAndTags, embedText } from '@/lib/embeddings';

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }
  const payloadRaw = form.get('payload');
  let payload: unknown = {};
  if (typeof payloadRaw === 'string') {
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
  }
  const parsedPayload = uploadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { width = 0, height = 0 } = await sharp(buffer).metadata();
  const { hex } = await computeDominantColor(buffer);
  const stored = await storeImageFile(`${user.id}`, file.type, buffer);

  const image = await prisma.imageAsset.create({
    data: {
      userId: user.id,
      storageUrl: stored.url,
      width,
      height,
      bytes: file.size,
      mime: file.type,
      colorDominant: hex
    }
  });

  if (parsedPayload.data.folderIds?.length) {
    const folders = await prisma.folder.findMany({
      where: { id: { in: parsedPayload.data.folderIds }, userId: user.id },
      select: { id: true }
    });
    await prisma.imageFolder.createMany({
      data: folders.map((folder) => ({ imageId: image.id, folderId: folder.id })),
      skipDuplicates: true
    });
  }

  const { caption, tags } = await autoCaptionAndTags(stored.url);
  // Merge manual + auto tags so creators always keep control over taxonomy.
  const combinedTags = Array.from(new Set([...(parsedPayload.data.tags ?? []), ...(tags ?? [])]));
  if (caption) {
    await prisma.imageAsset.update({ where: { id: image.id }, data: { caption } });
  }
  if (combinedTags.length) {
    const normalized = Array.from(new Set(combinedTags.map((t) => t.toLowerCase().trim())));
    for (const tagName of normalized) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId: user.id, name: tagName } },
        create: { userId: user.id, name: tagName },
        update: {}
      });
      await prisma.imageTag.upsert({
        where: { imageId_tagId: { imageId: image.id, tagId: tag.id } },
        create: { imageId: image.id, tagId: tag.id },
        update: {}
      });
    }
  }
  if (caption) {
    const embedding = await embedText(caption);
    if (embedding) {
      await prisma.embedding.upsert({
        where: { imageId: image.id },
        create: { imageId: image.id, vector: embedding },
        update: { vector: embedding }
      });
    }
  }

  return NextResponse.json({ id: image.id });
}
