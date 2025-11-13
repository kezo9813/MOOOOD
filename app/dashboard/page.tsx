import { redirect } from 'next/navigation';
import { UploadDropzone } from '@/components/UploadDropzone';
import { prisma } from '@/lib/prisma';
import { authSession } from '@/lib/auth';
import { ImageGrid } from '@/components/ImageGrid';
import { SimilarityRail } from '@/components/SimilarityRail';
import { recommendContext } from '@/lib/reco';
import { DashboardSearch } from '@/components/DashboardSearch';

export default async function DashboardPage({ searchParams }: { searchParams?: { q?: string } }) {
  const session = await authSession();
  if (!session?.user?.email) {
    redirect('/login');
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/login');
  const query = searchParams?.q ?? '';
  const [images, folders, suggestions] = await Promise.all([
    prisma.imageAsset.findMany({
      where: {
        userId: user.id,
        ...(query
          ? {
              OR: [
                { caption: { contains: query, mode: 'insensitive' } },
                { imageTags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } }
              ]
            }
          : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { imageTags: { include: { tag: true } } }
    }),
    prisma.folder.findMany({ where: { userId: user.id } }),
    recommendContext(user.id, 'afterUpload')
  ]);
  const suggestionCards = suggestions.map((image) => ({ id: image.id, storageUrl: image.storageUrl, caption: image.caption }));
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 p-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold">Dashboard</h1>
        <p className="text-white/70">Upload new references, manage tags, and seed recommendations.</p>
      </header>
      <UploadDropzone />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Library</h2>
          <p className="text-sm text-white/50">{folders.length} folders · {images.length} images</p>
        </div>
        <DashboardSearch />
        <ImageGrid images={images} />
      </section>
      <SimilarityRail title="Contextual suggestions" images={suggestionCards} />
    </main>
  );
}
