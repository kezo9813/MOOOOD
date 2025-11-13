import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authSession } from '@/lib/auth';
import { ImageGrid } from '@/components/ImageGrid';
import { SimilarityRail } from '@/components/SimilarityRail';
import { recommendContext } from '@/lib/reco';

export default async function FolderPage({ params }: { params: { id: string } }) {
  const session = await authSession();
  if (!session?.user?.email) {
    notFound();
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) notFound();
  const folder = await prisma.folder.findFirst({ where: { id: Number(params.id), userId: user.id } });
  if (!folder) notFound();
  const images = await prisma.imageAsset.findMany({
    where: { userId: user.id, imageFolders: { some: { folderId: folder.id } } },
    orderBy: { createdAt: 'desc' }
  });
  const suggestions = await recommendContext(user.id, 'folder', folder.id);
  const suggestionCards = suggestions.map((image) => ({ id: image.id, storageUrl: image.storageUrl, caption: image.caption }));
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Folder</p>
        <h1 className="text-3xl font-semibold">{folder.name}</h1>
      </header>
      <ImageGrid images={images} />
      <SimilarityRail title="Suggestions for this folder" images={suggestionCards} />
    </main>
  );
}
