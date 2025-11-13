import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authSession } from '@/lib/auth';
import { TagEditor } from '@/components/TagEditor';
import { SimilarityRail } from '@/components/SimilarityRail';
import { recommendContext } from '@/lib/reco';

export default async function ImagePage({ params }: { params: { id: string } }) {
  const session = await authSession();
  if (!session?.user?.email) notFound();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) notFound();
  const image = await prisma.imageAsset.findFirst({
    where: { id: Number(params.id), userId: user.id },
    include: { imageTags: { include: { tag: true } }, embedding: true }
  });
  if (!image) notFound();
  const suggestions = await recommendContext(user.id, 'image', image.id);
  const suggestionCards = suggestions.map((item) => ({ id: item.id, storageUrl: item.storageUrl, caption: item.caption }));
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <img alt={image.caption ?? 'untitled image'} className="w-full" src={image.storageUrl} />
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Image</p>
            <h1 className="text-3xl font-semibold">{image.caption ?? 'Untitled image'}</h1>
            <p className="text-sm text-white/60">{Math.round(image.width)} × {Math.round(image.height)} · {image.mime}</p>
          </div>
          <TagEditor imageId={image.id} tags={image.imageTags.map((t) => t.tag.name)} />
          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">Embedding</h3>
            <p className="text-xs text-white/50">
              {image.embedding ? 'Vector stored via pgvector.' : 'Embedding unavailable for this asset.'}
            </p>
          </div>
        </div>
      </div>
      <SimilarityRail title="Images similaires" images={suggestionCards} />
    </main>
  );
}
