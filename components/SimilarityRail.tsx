import Link from 'next/link';

type Image = {
  id: number;
  storageUrl: string;
  caption: string | null;
};

export function SimilarityRail({ title, images }: { title: string; images: Image[] }) {
  if (!images.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">{title}</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {images.map((image) => (
          <Link key={image.id} href={`/images/${image.id}`} className="min-w-[160px]">
            <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10">
              <img alt={image.caption ?? 'untitled image'} className="h-full w-full object-cover" src={image.storageUrl} />
            </div>
            <p className="mt-2 text-xs text-white/70">{image.caption ?? 'Untitled'}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
