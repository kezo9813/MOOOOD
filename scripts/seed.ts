import { prisma } from '../lib/prisma';
import { embedText } from '../lib/embeddings';

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@mood.app' },
    update: {},
    create: { email: 'demo@mood.app', passwordHash: null }
  });
  await Promise.all(
    ['Materials', 'Lighting', 'Sketches'].map((name) =>
      prisma.folder.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: {},
        create: { userId: user.id, name }
      })
    )
  );
  const images = await Promise.all(
    Array.from({ length: 8 }).map((_, idx) =>
      prisma.imageAsset.upsert({
        where: { id: idx + 1 },
        update: {},
        create: {
          userId: user.id,
          storageUrl: `https://picsum.photos/seed/mood-${idx}/600/800`,
          width: 600,
          height: 800,
          bytes: 1024,
          mime: 'image/jpeg',
          colorDominant: '#444444',
          caption: `Sample inspiration ${idx + 1}`
        }
      })
    )
  );
  for (const image of images) {
    const embedding = await embedText(image.caption ?? '');
    if (embedding) {
      await prisma.embedding.upsert({
        where: { imageId: image.id },
        update: { vector: embedding },
        create: { imageId: image.id, vector: embedding }
      });
    }
  }
  if (!images.length) return;
  await prisma.moodboard.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: user.id,
      title: 'Demo board',
      prompt: 'earthy red + brutalist',
      imageIds: images.map((img) => img.id),
      layoutJson: JSON.stringify(
        images.map((img, idx) => ({ imageId: img.id, x: idx * 20, y: idx * 10, scale: 1, z: idx }))
      )
    }
  });
  console.log('Seed complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
