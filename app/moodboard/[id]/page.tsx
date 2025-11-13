import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authSession } from '@/lib/auth';
import { MoodboardEditor } from '@/components/MoodboardEditor';
import { ExportMoodboardButton } from '@/components/ExportMoodboardButton';
import { SimilarityRail } from '@/components/SimilarityRail';
import { recommendContext } from '@/lib/reco';

export default async function MoodboardPage({ params }: { params: { id: string } }) {
  const session = await authSession();
  if (!session?.user?.email) notFound();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) notFound();
  const moodboard = await prisma.moodboard.findFirst({ where: { id: Number(params.id), userId: user.id } });
  if (!moodboard) notFound();
  const images = await prisma.imageAsset.findMany({ where: { id: { in: moodboard.imageIds } } });
  const map = new Map(images.map((img) => [img.id, img]));
  const rawLayout = (() => {
    try {
      return JSON.parse(moodboard.layoutJson ?? '[]');
    } catch {
      return [];
    }
  })();
  const layout = (rawLayout as any[]).map((tile, idx) => ({
    imageId: tile.imageId,
    storageUrl: map.get(tile.imageId)?.storageUrl ?? '',
    x: tile.x ?? idx * 20,
    y: tile.y ?? idx * 20,
    scale: tile.scale ?? 1,
    z: tile.z ?? idx
  }));
  const suggestions = await recommendContext(user.id, 'moodboard', moodboard.id);
  const suggestionCards = suggestions.map((item) => ({ id: item.id, storageUrl: item.storageUrl, caption: item.caption }));
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Moodboard</p>
          <h1 className="text-3xl font-semibold">{moodboard.title}</h1>
          <p className="text-white/60">{moodboard.prompt}</p>
        </div>
        <ExportMoodboardButton moodboardId={moodboard.id} />
      </header>
      <MoodboardEditor moodboardId={moodboard.id} initialTiles={layout} />
      <SimilarityRail title="More inspiration" images={suggestionCards} />
    </main>
  );
}
